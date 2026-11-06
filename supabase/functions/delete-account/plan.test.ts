import { describe, expect, it } from 'vitest';
import { storageRemovalBatches, stripeCustomersOf, subscriptionsToCancel } from './plan';

describe('stripeCustomersOf', () => {
  it('merges linked and email matches without duplicates or blanks', () => {
    expect(stripeCustomersOf(['cus_1', null], ['cus_1', 'cus_2'])).toEqual(['cus_1', 'cus_2']);
  });

  it('is empty for someone who never paid', () => {
    expect(stripeCustomersOf([null], [])).toEqual([]);
  });
});

describe('subscriptionsToCancel', () => {
  it('keeps every subscription that could still charge the customer', () => {
    const statuses = ['active', 'trialing', 'past_due', 'unpaid', 'incomplete', 'paused'];

    expect(
      subscriptionsToCancel(statuses.map((status) => ({ status }))).map(({ status }) => status),
    ).toEqual(statuses);
  });

  it('skips finished subscriptions, which Stripe refuses to cancel again', () => {
    expect(
      subscriptionsToCancel([{ status: 'canceled' }, { status: 'incomplete_expired' }]),
    ).toEqual([]);
  });
});

describe('storageRemovalBatches', () => {
  it('groups objects by bucket', () => {
    expect(
      storageRemovalBatches([
        { bucket_id: 'exam-images', object_name: 'a.png' },
        { bucket_id: 'temp_pdfs', object_name: 'b.pdf' },
        { bucket_id: 'exam-images', object_name: 'c.png' },
      ]),
    ).toEqual([
      { bucket: 'exam-images', paths: ['a.png', 'c.png'] },
      { bucket: 'temp_pdfs', paths: ['b.pdf'] },
    ]);
  });

  it('splits a bucket that exceeds the batch size', () => {
    const objects = ['a', 'b', 'c'].map((object_name) => ({
      bucket_id: 'exam-images',
      object_name,
    }));

    expect(storageRemovalBatches(objects, 2).map(({ paths }) => paths)).toEqual([
      ['a', 'b'],
      ['c'],
    ]);
  });
});
