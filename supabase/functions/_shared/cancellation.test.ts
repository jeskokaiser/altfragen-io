import { describe, expect, it } from 'vitest';
import { berlinToday, confirmationLines, parseCancellationRequest } from './cancellation';

const TODAY = '2026-11-08';
const valid = { email: ' Anna@Uni-Hamburg.de ', contract: 'premium_semester', kind: 'ordinary' };

describe('parseCancellationRequest', () => {
  it('accepts an ordinary cancellation and normalises the e-mail', () => {
    const result = parseCancellationRequest(valid, TODAY);
    expect(result).toEqual({
      ok: true,
      value: {
        email: 'anna@uni-hamburg.de',
        name: null,
        contract: 'premium_semester',
        kind: 'ordinary',
        reason: null,
        endOn: null,
      },
    });
  });

  it('drops a reason on an ordinary cancellation', () => {
    const result = parseCancellationRequest({ ...valid, reason: 'egal' }, TODAY);
    expect(result.ok && result.value.reason).toBeNull();
  });

  it('requires a reason for an extraordinary cancellation', () => {
    expect(parseCancellationRequest({ ...valid, kind: 'extraordinary' }, TODAY).ok).toBe(false);
    const result = parseCancellationRequest(
      { ...valid, kind: 'extraordinary', reason: '  Dienst fällt dauernd aus ' },
      TODAY,
    );
    expect(result.ok && result.value.reason).toBe('Dienst fällt dauernd aus');
  });

  it('accepts today or a later date and refuses past or impossible dates', () => {
    expect(parseCancellationRequest({ ...valid, endOn: TODAY }, TODAY).ok).toBe(true);
    expect(parseCancellationRequest({ ...valid, endOn: '2027-01-31' }, TODAY).ok).toBe(true);
    expect(parseCancellationRequest({ ...valid, endOn: '2026-11-07' }, TODAY).ok).toBe(false);
    expect(parseCancellationRequest({ ...valid, endOn: '2027-02-30' }, TODAY).ok).toBe(false);
    expect(parseCancellationRequest({ ...valid, endOn: '31.01.2027' }, TODAY).ok).toBe(false);
    expect(parseCancellationRequest({ ...valid, endOn: '2027-13-45' }, TODAY).ok).toBe(false);
  });

  it('refuses unknown contracts, kinds and broken input', () => {
    expect(parseCancellationRequest({ ...valid, contract: 'yearly' }, TODAY).ok).toBe(false);
    expect(parseCancellationRequest({ ...valid, contract: 'toString' }, TODAY).ok).toBe(false);
    expect(parseCancellationRequest({ ...valid, kind: 'now' }, TODAY).ok).toBe(false);
    expect(parseCancellationRequest({ ...valid, email: 'keine-mail' }, TODAY).ok).toBe(false);
    expect(parseCancellationRequest({ ...valid, name: 'x'.repeat(201) }, TODAY).ok).toBe(false);
    expect(parseCancellationRequest(null, TODAY).ok).toBe(false);
  });
});

describe('berlinToday', () => {
  it('uses the Berlin date, not the UTC date', () => {
    expect(berlinToday(new Date('2026-11-08T23:30:00Z'))).toBe('2026-11-09');
  });
});

describe('confirmationLines', () => {
  it('lists content, time of receipt and intended end', () => {
    const result = parseCancellationRequest({ ...valid, endOn: '2027-01-31' }, TODAY);
    if (!result.ok) throw new Error(result.error);
    const lines = confirmationLines(result.value, new Date('2026-11-08T14:05:00Z'));
    expect(lines).toContain('Vertrag: Premium-Semesterabo');
    expect(lines).toContain('Vertragsende: zum 31. Januar 2027');
    expect(lines).toContain('Eingegangen am: 8. November 2026 um 15:05 Uhr');
  });
});
