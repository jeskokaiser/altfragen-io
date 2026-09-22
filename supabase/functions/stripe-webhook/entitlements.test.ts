import { describe, expect, it } from 'vitest';
import {
  CREDITS_PER_PACK,
  applySubscriptionEvent,
  creditsForQuantity,
  isLifetimeEntitlement,
  isTransientSubscriptionCreation,
  quotaMonthStart,
  resolveLifetimeEntitlement,
  resolveSubscriptionEntitlement,
} from './entitlements.ts';

const PRICES = { monthly: 'price_monthly', semester: 'price_semester' };

// 2026-03-15T12:00:00Z
const PERIOD_END = 1773576000;

describe('resolveSubscriptionEntitlement', () => {
  it('grants access while the subscription is active', () => {
    expect(
      resolveSubscriptionEntitlement(
        { status: 'active', priceId: PRICES.monthly, currentPeriodEnd: PERIOD_END },
        PRICES,
      ),
    ).toEqual({
      subscribed: true,
      tier: 'Monthly',
      subscriptionEnd: new Date(PERIOD_END * 1000).toISOString(),
    });
  });

  it('grants access during a trial', () => {
    const entitlement = resolveSubscriptionEntitlement({ status: 'trialing' }, PRICES);

    expect(entitlement.subscribed).toBe(true);
  });

  it.each(['canceled', 'incomplete', 'incomplete_expired', 'past_due', 'unpaid', 'paused'])(
    'revokes access for status %s',
    (status) => {
      expect(
        resolveSubscriptionEntitlement(
          { status, priceId: PRICES.monthly, currentPeriodEnd: PERIOD_END },
          PRICES,
        ),
      ).toEqual({ subscribed: false, tier: null, subscriptionEnd: null });
    },
  );

  it('clears the tier and end date rather than leaving stale ones behind', () => {
    // The row is upserted, so a revoked subscription that kept its old end date
    // would keep reading as premium wherever that date is trusted.
    const revoked = resolveSubscriptionEntitlement(
      { status: 'canceled', priceId: PRICES.semester, currentPeriodEnd: PERIOD_END },
      PRICES,
    );

    expect(revoked.tier).toBeNull();
    expect(revoked.subscriptionEnd).toBeNull();
  });

  it('names the semester tier from its price ID', () => {
    const entitlement = resolveSubscriptionEntitlement(
      { status: 'active', priceId: PRICES.semester },
      PRICES,
    );

    expect(entitlement.tier).toBe('Semester');
  });

  it('falls back to the subscription metadata when the price ID is unknown', () => {
    const entitlement = resolveSubscriptionEntitlement(
      { status: 'active', priceId: 'price_migrated', priceType: 'semester' },
      PRICES,
    );

    expect(entitlement.tier).toBe('Semester');
  });

  it('accepts the capitalised metadata spelling too', () => {
    expect(
      resolveSubscriptionEntitlement(
        { status: 'active', priceId: 'price_migrated', priceType: 'Monthly' },
        PRICES,
      ).tier,
    ).toBe('Monthly');
  });

  it('keeps a subscription paid when its price cannot be named', () => {
    // A price created after this deployment was configured must not silently
    // read as "no tier", which would look like a free account.
    const entitlement = resolveSubscriptionEntitlement(
      { status: 'active', priceId: 'price_brand_new' },
      PRICES,
    );

    expect(entitlement).toMatchObject({ subscribed: true, tier: 'Unknown' });
  });

  it('reports no tier when there is no price at all', () => {
    const entitlement = resolveSubscriptionEntitlement({ status: 'active' }, PRICES);

    expect(entitlement).toMatchObject({ subscribed: true, tier: null });
  });

  it('ignores unconfigured price IDs instead of matching undefined', () => {
    // With no monthly price configured, a subscription without a price must not
    // match it by both sides being undefined.
    const entitlement = resolveSubscriptionEntitlement({ status: 'active' }, {});

    expect(entitlement.tier).toBeNull();
  });

  it('survives a subscription without a period end', () => {
    expect(
      resolveSubscriptionEntitlement({ status: 'active', currentPeriodEnd: null }, PRICES)
        .subscriptionEnd,
    ).toBeNull();
  });
});

describe('isTransientSubscriptionCreation', () => {
  it('ignores the incomplete state checkout creates before charging the card', () => {
    expect(isTransientSubscriptionCreation('customer.subscription.created', 'incomplete')).toBe(
      true,
    );
  });

  it('acts on an incomplete subscription reported by a later update', () => {
    // By then the payment has had its chance, so incomplete is real.
    expect(isTransientSubscriptionCreation('customer.subscription.updated', 'incomplete')).toBe(
      false,
    );
  });

  it('acts on a subscription created as active', () => {
    expect(isTransientSubscriptionCreation('customer.subscription.created', 'active')).toBe(false);
  });
});

describe('applySubscriptionEvent', () => {
  const revoked = { subscribed: false, tier: null, subscriptionEnd: null };
  const active = {
    subscribed: true,
    tier: 'Monthly',
    subscriptionEnd: '2026-04-15T12:00:00.000Z',
  };
  const lifetimeRow = {
    tier: 'Lifetime',
    subscribed: true,
    subscriptionEnd: '2126-03-15T12:00:00.000Z',
  };

  it('takes the event at face value when nothing is stored yet', () => {
    expect(applySubscriptionEvent(null, active)).toEqual(active);
    expect(applySubscriptionEvent(undefined, revoked)).toEqual(revoked);
  });

  it('lets an event revoke an ordinary subscription', () => {
    const stored = {
      tier: 'Monthly',
      subscribed: true,
      subscriptionEnd: '2026-04-15T12:00:00.000Z',
    };

    expect(applySubscriptionEvent(stored, revoked)).toEqual(revoked);
  });

  it('does not let a cancellation revoke lifetime access', () => {
    // The case this guard exists for: a lifetime buyer cancels the monthly plan
    // they no longer need, and the cancellation event upserts the same row.
    expect(applySubscriptionEvent(lifetimeRow, revoked)).toEqual({
      subscribed: true,
      tier: 'Lifetime',
      subscriptionEnd: '2126-03-15T12:00:00.000Z',
    });
  });

  it('does not downgrade lifetime access to a running subscription', () => {
    expect(applySubscriptionEvent(lifetimeRow, active).tier).toBe('Lifetime');
  });

  it('leaves a lifetime row exactly as it found it, rather than re-granting', () => {
    // Whatever put a lifetime row into this state, a subscription event is not
    // the thing that should decide to undo it.
    const withdrawn = { tier: 'Lifetime', subscribed: false, subscriptionEnd: null };

    expect(applySubscriptionEvent(withdrawn, active)).toEqual({
      subscribed: false,
      tier: 'Lifetime',
      subscriptionEnd: null,
    });
  });

  it('does not invent an end date for a lifetime row that has none', () => {
    const noEnd = { tier: 'Lifetime', subscribed: true };

    expect(applySubscriptionEvent(noEnd, revoked).subscriptionEnd).toBeNull();
  });

  it('assumes access for a lifetime row that does not say', () => {
    const unknownFlag = { tier: 'Lifetime', subscriptionEnd: '2126-03-15T12:00:00.000Z' };

    expect(applySubscriptionEvent(unknownFlag, revoked).subscribed).toBe(true);
  });
});

describe('isLifetimeEntitlement', () => {
  it('recognises the tier the webhook writes', () => {
    expect(isLifetimeEntitlement({ tier: 'Lifetime' })).toBe(true);
  });

  it('does not treat other tiers as lifetime', () => {
    // The table carries legacy spellings such as 'Premium (legacy)' and
    // 'Weekly'; none of them were bought outright.
    ['Monthly', 'Semester', 'Unknown', 'Premium (legacy)', 'Weekly', 'lifetime', null].forEach(
      (tier) => {
        expect(isLifetimeEntitlement({ tier })).toBe(false);
      },
    );
  });

  it('handles a missing row', () => {
    expect(isLifetimeEntitlement(null)).toBe(false);
    expect(isLifetimeEntitlement(undefined)).toBe(false);
  });
});

describe('resolveLifetimeEntitlement', () => {
  it('grants access far beyond any plausible renewal', () => {
    const now = new Date('2026-03-15T12:00:00.000Z');
    const entitlement = resolveLifetimeEntitlement(now);

    expect(entitlement.subscribed).toBe(true);
    expect(entitlement.tier).toBe('Lifetime');
    expect(new Date(entitlement.subscriptionEnd as string).getUTCFullYear()).toBe(2126);
  });
});

describe('creditsForQuantity', () => {
  it('grants one pack when Stripe reports no quantity', () => {
    expect(creditsForQuantity(undefined)).toBe(CREDITS_PER_PACK);
    expect(creditsForQuantity(null)).toBe(CREDITS_PER_PACK);
  });

  it('grants one pack per purchased unit', () => {
    expect(creditsForQuantity(3)).toBe(3 * CREDITS_PER_PACK);
  });
});

describe('quotaMonthStart', () => {
  it('buckets a purchase into the first day of its UTC month', () => {
    expect(quotaMonthStart(new Date('2026-03-15T12:00:00.000Z'))).toBe('2026-03-01');
  });

  it('uses UTC, not the server timezone, at a month boundary', () => {
    // 1 March 00:30 UTC is still February in some timezones; the quota row must
    // not depend on where the function happens to run.
    expect(quotaMonthStart(new Date('2026-03-01T00:30:00.000Z'))).toBe('2026-03-01');
    expect(quotaMonthStart(new Date('2026-02-28T23:30:00.000Z'))).toBe('2026-02-01');
  });
});
