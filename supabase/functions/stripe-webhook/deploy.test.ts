import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('stripe-webhook deploy config', () => {
  // A deploy with verify_jwt on blocked every webhook from 2026-09-22 to
  // 2026-10-30: lifetime purchases were paid for and never granted.
  it('lets Stripe past the verify_jwt gate', () => {
    const config = readFileSync('supabase/config.toml', 'utf8');
    expect(config).toMatch(/\[functions\.stripe-webhook\]\s*\nverify_jwt = false/);
  });
});
