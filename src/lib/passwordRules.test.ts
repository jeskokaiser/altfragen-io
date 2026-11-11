import { describe, expect, it } from 'vitest';
import { missingPasswordRules } from './passwordRules';

describe('missingPasswordRules', () => {
  it('lists every rule an empty password misses', () => {
    expect(missingPasswordRules('')).toEqual([
      'mindestens 8 Zeichen',
      'einen Großbuchstaben',
      'einen Kleinbuchstaben',
      'eine Zahl',
      'ein Sonderzeichen',
    ]);
  });

  it('accepts a password that meets all rules', () => {
    expect(missingPasswordRules('Kreuz3n!')).toEqual([]);
  });

  it('names only what is missing', () => {
    expect(missingPasswordRules('kreuzen1!')).toEqual(['einen Großbuchstaben']);
  });
});
