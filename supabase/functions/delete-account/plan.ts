// The decisions behind delete-account, kept free of Deno imports so vitest can
// run them.

export interface StorageObjectRef {
  bucket_id: string;
  object_name: string;
}

/** Stripe customers of this user: the linked one and any found by verified email. */
export const stripeCustomersOf = (
  linked: Array<string | null>,
  foundByEmail: string[],
): string[] => [...new Set([...linked, ...foundByEmail].filter((id): id is string => Boolean(id)))];

const FINISHED_SUBSCRIPTION_STATUSES = ['canceled', 'incomplete_expired'];

/** Everything that could still charge the customer, not only what grants premium. */
export const subscriptionsToCancel = <T extends { status: string }>(subscriptions: T[]): T[] =>
  subscriptions.filter(({ status }) => !FINISHED_SUBSCRIPTION_STATUSES.includes(status));

/** The Storage API removes per bucket and takes at most 1000 paths per call. */
export const storageRemovalBatches = (
  objects: StorageObjectRef[],
  batchSize = 1000,
): Array<{ bucket: string; paths: string[] }> => {
  const byBucket = new Map<string, string[]>();
  for (const { bucket_id, object_name } of objects) {
    byBucket.set(bucket_id, [...(byBucket.get(bucket_id) ?? []), object_name]);
  }

  const batches: Array<{ bucket: string; paths: string[] }> = [];
  for (const [bucket, paths] of byBucket) {
    for (let start = 0; start < paths.length; start += batchSize) {
      batches.push({ bucket, paths: paths.slice(start, start + batchSize) });
    }
  }
  return batches;
};
