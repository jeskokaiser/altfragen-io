// Validation and wording for the cancellation page (§ 312k BGB). Pure code, so
// vitest covers it and submit-cancellation imports it under Deno.

export const CONTRACTS = {
  premium_monthly: 'Premium-Monatsabo',
  premium_semester: 'Premium-Semesterabo',
  lifetime: 'Lifetime Premium',
} as const;

export const KINDS = {
  ordinary: 'Ordentliche Kündigung',
  extraordinary: 'Außerordentliche Kündigung aus wichtigem Grund',
} as const;

export type Contract = keyof typeof CONTRACTS;
export type Kind = keyof typeof KINDS;

export interface Cancellation {
  email: string;
  name: string | null;
  contract: Contract;
  kind: Kind;
  reason: string | null;
  /** YYYY-MM-DD; null means the earliest possible date (§ 312k Abs. 5 BGB). */
  endOn: string | null;
}

export type ParseResult = { ok: true; value: Cancellation } | { ok: false; error: string };

const isKey = (map: object, key: unknown): boolean =>
  typeof key === 'string' && Object.prototype.hasOwnProperty.call(map, key);

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

const optionalText = (value: unknown): string | null =>
  typeof value === 'string' && value.trim() !== '' ? value.trim() : null;

const isRealDate = (value: string): boolean => {
  if (!DATE.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
};

/** `today` is the current date in Europe/Berlin as YYYY-MM-DD. */
export const parseCancellationRequest = (body: unknown, today: string): ParseResult => {
  if (typeof body !== 'object' || body === null) return { ok: false, error: 'Ungültige Anfrage.' };
  const b = body as Record<string, unknown>;

  const email = typeof b.email === 'string' ? b.email.trim().toLowerCase() : '';
  if (!EMAIL.test(email) || email.length > 320) {
    return { ok: false, error: 'Bitte gib eine gültige E-Mail-Adresse an.' };
  }

  const name = optionalText(b.name);
  if (name && name.length > 200) return { ok: false, error: 'Der Name ist zu lang.' };

  if (!isKey(CONTRACTS, b.contract)) {
    return { ok: false, error: 'Bitte wähle den Vertrag, den du kündigen willst.' };
  }
  if (!isKey(KINDS, b.kind)) {
    return { ok: false, error: 'Bitte wähle die Art der Kündigung.' };
  }
  const contract = b.contract as Contract;
  const kind = b.kind as Kind;

  const reason = kind === 'extraordinary' ? optionalText(b.reason) : null;
  if (kind === 'extraordinary' && !reason) {
    return { ok: false, error: 'Bitte gib den Grund für die außerordentliche Kündigung an.' };
  }
  if (reason && reason.length > 2000) return { ok: false, error: 'Der Grund ist zu lang.' };

  const endOn = optionalText(b.endOn);
  if (endOn && (!isRealDate(endOn) || endOn < today)) {
    return { ok: false, error: 'Bitte wähle ein gültiges Datum ab heute.' };
  }

  return { ok: true, value: { email, name, contract, kind, reason, endOn } };
};

const BERLIN = 'Europe/Berlin';

/** Current date in Europe/Berlin as YYYY-MM-DD. */
export const berlinToday = (now: Date): string =>
  new Intl.DateTimeFormat('en-CA', { timeZone: BERLIN }).format(now);

export const formatReceivedAt = (receivedAt: Date): string =>
  new Intl.DateTimeFormat('de-DE', {
    timeZone: BERLIN,
    dateStyle: 'long',
    timeStyle: 'short',
  }).format(receivedAt) + ' Uhr';

const formatDate = (isoDate: string): string =>
  new Intl.DateTimeFormat('de-DE', { timeZone: 'UTC', dateStyle: 'long' }).format(
    new Date(`${isoDate}T00:00:00Z`),
  );

export const endLabel = (endOn: string | null): string =>
  endOn ? `zum ${formatDate(endOn)}` : 'zum frühestmöglichen Zeitpunkt';

/** The lines § 312k Abs. 4 BGB requires: content, time of receipt, intended end. */
export const confirmationLines = (c: Cancellation, receivedAt: Date): string[] => [
  `Vertrag: ${CONTRACTS[c.contract]}`,
  `Art der Kündigung: ${KINDS[c.kind]}`,
  ...(c.reason ? [`Grund: ${c.reason}`] : []),
  `E-Mail-Adresse: ${c.email}`,
  ...(c.name ? [`Name: ${c.name}`] : []),
  `Vertragsende: ${endLabel(c.endOn)}`,
  `Eingegangen am: ${formatReceivedAt(receivedAt)}`,
];
