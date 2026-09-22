/**
 * The entitlement decisions the Stripe webhook makes, separated from the I/O
 * around them.
 *
 * The webhook itself is Deno and imports Stripe over URL, so nothing in it can
 * be reached from a Node test runner. This module deliberately depends on
 * nothing: it takes plain snapshots of the Stripe objects and returns what
 * should be written, which is the part that decides whether a paying user has
 * access. The mapping from a Stripe object to a snapshot stays in index.ts.
 */

/** The subscription statuses that grant premium access. Everything else revokes it. */
export const PREMIUM_STATUSES = ['active', 'trialing'];

export const LIFETIME_TIER = 'Lifetime';

/** Private questions granted per purchased AI credit pack. */
export const CREDITS_PER_PACK = 100;

/** Roughly forever: what a lifetime purchase sets as its subscription end. */
const LIFETIME_YEARS = 100;

export interface SubscriptionSnapshot {
  /** `subscription.status`. */
  status: string;
  /** `subscription.items.data[0].price.id`, if the subscription has one. */
  priceId?: string | null;
  /** `subscription.metadata.price_type`, the fallback when the price ID is unknown. */
  priceType?: string | null;
  /** `subscription.current_period_end`, in seconds since the epoch. */
  currentPeriodEnd?: number | null;
}

/** The price IDs this deployment is configured with. */
export interface ConfiguredPrices {
  monthly?: string | null;
  semester?: string | null;
}

export interface Entitlement {
  subscribed: boolean;
  tier: string | null;
  /** ISO timestamp, or null when the user has no access to lose. */
  subscriptionEnd: string | null;
}

const toIsoOrNull = (unixSeconds?: number | null): string | null => {
  if (!unixSeconds) return null;

  const milliseconds = unixSeconds * 1000;
  if (!milliseconds || isNaN(milliseconds)) return null;

  return new Date(milliseconds).toISOString();
};

/**
 * Which tier a premium subscription belongs to.
 *
 * The configured price IDs decide it. When they do not match -- a price created
 * after this deployment was configured, or a subscription migrated from
 * elsewhere -- the subscription's own metadata is the fallback, and a price we
 * cannot name at all still counts as a paid tier rather than none.
 */
const resolveTier = (
  subscription: SubscriptionSnapshot,
  prices: ConfiguredPrices,
): string | null => {
  const { priceId, priceType } = subscription;

  if (prices.semester && priceId === prices.semester) return 'Semester';
  if (prices.monthly && priceId === prices.monthly) return 'Monthly';

  // Only these two spellings each, as the webhook has always matched them.
  if (priceType === 'semester' || priceType === 'Semester') return 'Semester';
  if (priceType === 'monthly' || priceType === 'Monthly') return 'Monthly';

  return priceId ? 'Unknown' : null;
};

/**
 * What to store for a subscription in its current state.
 *
 * A subscription that is not premium clears the tier and the end date rather
 * than leaving stale ones behind.
 */
export const resolveSubscriptionEntitlement = (
  subscription: SubscriptionSnapshot,
  prices: ConfiguredPrices = {},
): Entitlement => {
  const subscribed = PREMIUM_STATUSES.includes(subscription.status);

  if (!subscribed) {
    return { subscribed: false, tier: null, subscriptionEnd: null };
  }

  return {
    subscribed: true,
    tier: resolveTier(subscription, prices),
    subscriptionEnd: toIsoOrNull(subscription.currentPeriodEnd),
  };
};

/** The entitlement a `subscribers` row already carries, as far as it is known. */
export interface StoredEntitlement {
  tier?: string | null;
  subscribed?: boolean | null;
  subscriptionEnd?: string | null;
}

/** Whether a stored row was bought as lifetime access. */
export const isLifetimeEntitlement = (stored?: StoredEntitlement | null): boolean =>
  stored?.tier === LIFETIME_TIER;

/**
 * What to store after a subscription event, given what is already stored.
 *
 * Lifetime access is bought once and outlives any subscription. Both live in
 * the same `subscribers` row, keyed by email, and subscription events upsert
 * that row -- so without this, a lifetime buyer who cancels the monthly plan
 * they no longer need, or whose old plan simply lapses, has their lifetime
 * access revoked by the cancellation event. A subscription event therefore
 * leaves a lifetime row exactly as it found it.
 */
export const applySubscriptionEvent = (
  stored: StoredEntitlement | null | undefined,
  incoming: Entitlement,
): Entitlement => {
  if (!isLifetimeEntitlement(stored)) return incoming;

  return {
    subscribed: stored?.subscribed ?? true,
    tier: LIFETIME_TIER,
    subscriptionEnd: stored?.subscriptionEnd ?? null,
  };
};

/**
 * Whether a subscription event is the transient state Stripe reports before the
 * first payment goes through.
 *
 * Checkout creates the subscription as "incomplete" and only then charges the
 * card. Acting on that would mark a user as unsubscribed between the two, so it
 * is ignored and the later `updated` event decides.
 */
export const isTransientSubscriptionCreation = (eventType: string, status: string): boolean =>
  eventType === 'customer.subscription.created' && status === 'incomplete';

/** What to store for a completed lifetime purchase. */
export const resolveLifetimeEntitlement = (now: Date): Entitlement => ({
  subscribed: true,
  tier: LIFETIME_TIER,
  subscriptionEnd: new Date(
    now.getTime() + LIFETIME_YEARS * 365 * 24 * 60 * 60 * 1000,
  ).toISOString(),
});

/** Credits granted for a purchase of `quantity` packs. */
export const creditsForQuantity = (quantity?: number | null): number =>
  CREDITS_PER_PACK * (quantity ?? 1);

/** The quota bucket a purchase falls into: the first day of the current UTC month. */
export const quotaMonthStart = (now: Date): string =>
  new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString().slice(0, 10);
