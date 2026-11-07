// Caller checks for docs/cross-repo-plan.md, contract C1-C4.
//
// Pure functions only -- no Deno globals and no URL imports -- so vitest can
// cover them. The functions that need Supabase (verifying a user's token,
// reading a profile) stay in each Edge Function, which already holds a client.

/** The token of an `Authorization: Bearer <token>` header, or null. */
export const bearerToken = (header: string | null | undefined): string | null => {
  if (!header) return null;
  const [scheme, ...rest] = header.trim().split(/\s+/);
  const token = rest.join(' ');
  if (scheme?.toLowerCase() !== 'bearer' || !token) return null;
  return token;
};

/** Compares two strings in time that depends only on their lengths. */
export const timingSafeEqual = (a: string, b: string): boolean => {
  const encoder = new TextEncoder();
  const left = encoder.encode(a);
  const right = encoder.encode(b);
  let diff = left.length ^ right.length;
  const length = Math.max(left.length, right.length);
  for (let i = 0; i < length; i++) {
    diff |= (left[i] ?? 0) ^ (right[i] ?? 0);
  }
  return diff === 0;
};

/**
 * C3: a cron call carries `x-cron-secret` equal to the CRON_SECRET environment
 * variable. An unset or empty secret refuses every call rather than none.
 */
export const isCronCall = (
  header: string | null | undefined,
  expected: string | null | undefined,
): boolean => !!expected && !!header && timingSafeEqual(header, expected);

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const isUuid = (value: unknown): value is string =>
  typeof value === 'string' && UUID.test(value);

/** C1: the parser's task ids, as `check-pdf-status` accepts them. */
export const isTaskId = (value: unknown): value is string =>
  typeof value === 'string' && /^[0-9a-f-]{36}$/.test(value);

export const MAX_ASSIGN_QUESTIONS = 1000;
export const MAX_SUBJECTS = 200;
const MAX_SUBJECT_LENGTH = 200;

type Invalid = { ok: false; error: string };

const checkSubjects = (subjects: unknown): string[] | Invalid => {
  if (!Array.isArray(subjects) || subjects.length === 0) {
    return { ok: false, error: 'availableSubjects must be a non-empty array' };
  }
  if (subjects.length > MAX_SUBJECTS) {
    return { ok: false, error: `availableSubjects allows at most ${MAX_SUBJECTS} entries` };
  }
  if (
    !subjects.every(
      (s) => typeof s === 'string' && s.trim().length > 0 && s.length <= MAX_SUBJECT_LENGTH,
    )
  ) {
    return { ok: false, error: 'availableSubjects must be non-empty strings' };
  }
  return subjects as string[];
};

export type AssignRequest = {
  ok: true;
  questions: Array<Record<string, unknown> & { id: string }>;
  questionIds: string[];
  availableSubjects: string[];
};

/**
 * C4, assign-subjects: the body's questions and subjects, bounded. The user is
 * not taken from the body; the caller passes the verified one separately.
 */
export const parseAssignRequest = (body: unknown): AssignRequest | Invalid => {
  const { questions, availableSubjects } = (body ?? {}) as Record<string, unknown>;
  if (!Array.isArray(questions) || questions.length === 0) {
    return { ok: false, error: 'questions must be a non-empty array' };
  }
  if (questions.length > MAX_ASSIGN_QUESTIONS) {
    return { ok: false, error: `At most ${MAX_ASSIGN_QUESTIONS} questions per job` };
  }
  if (!questions.every((q) => q && typeof q === 'object' && isUuid((q as { id?: unknown }).id))) {
    return { ok: false, error: 'Every question needs a valid id' };
  }
  const subjects = checkSubjects(availableSubjects);
  if (!Array.isArray(subjects)) return subjects;
  const typed = questions as AssignRequest['questions'];
  return {
    ok: true,
    questions: typed,
    questionIds: [...new Set(typed.map((q) => q.id))],
    availableSubjects: subjects,
  };
};

export type ReassignRequest = {
  ok: true;
  examName: string;
  universityId: string;
  onlyNullSubjects: boolean;
  availableSubjects: string[];
};

/** C4, reassign-subjects: a real university id is required; null and "all" are refused. */
export const parseReassignRequest = (body: unknown): ReassignRequest | Invalid => {
  const { examName, universityId, onlyNullSubjects, availableSubjects } = (body ?? {}) as Record<
    string,
    unknown
  >;
  if (typeof examName !== 'string' || !examName.trim() || examName.length > 300) {
    return { ok: false, error: 'examName is required' };
  }
  if (!isUuid(universityId)) {
    return { ok: false, error: 'universityId must be a university id' };
  }
  const subjects = checkSubjects(availableSubjects);
  if (!Array.isArray(subjects)) return subjects;
  return {
    ok: true,
    examName: examName.trim(),
    universityId,
    onlyNullSubjects: !!onlyNullSubjects,
    availableSubjects: subjects,
  };
};
