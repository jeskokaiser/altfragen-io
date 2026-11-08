import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  bearerToken,
  isCronCall,
  isTaskId,
  MAX_ASSIGN_QUESTIONS,
  parseAssignRequest,
  parseReassignRequest,
  timingSafeEqual,
} from './callerAuth';

const ID = '11111111-1111-4111-8111-111111111111';
const UNI = '22222222-2222-4222-8222-222222222222';

describe('bearerToken', () => {
  it('reads the token of a bearer header', () => {
    expect(bearerToken('Bearer abc.def')).toBe('abc.def');
    expect(bearerToken('bearer abc')).toBe('abc');
  });

  it('refuses anything else', () => {
    expect(bearerToken(null)).toBeNull();
    expect(bearerToken('')).toBeNull();
    expect(bearerToken('Bearer ')).toBeNull();
    expect(bearerToken('Basic abc')).toBeNull();
  });
});

describe('isCronCall (C3)', () => {
  it('accepts only the exact secret', () => {
    expect(isCronCall('s3cret', 's3cret')).toBe(true);
    expect(isCronCall('s3cre', 's3cret')).toBe(false);
    expect(isCronCall('s3cret!', 's3cret')).toBe(false);
    expect(isCronCall(null, 's3cret')).toBe(false);
  });

  it('refuses every call while CRON_SECRET is unset', () => {
    expect(isCronCall('', '')).toBe(false);
    expect(isCronCall('anything', undefined)).toBe(false);
  });

  it('compares without short-circuiting on the first byte', () => {
    expect(timingSafeEqual('abc', 'abc')).toBe(true);
    expect(timingSafeEqual('abc', 'abd')).toBe(false);
    expect(timingSafeEqual('', '')).toBe(true);
  });
});

describe('isTaskId (C1)', () => {
  it('accepts the parser task id shape only', () => {
    expect(isTaskId(ID)).toBe(true);
    expect(isTaskId('../health')).toBe(false);
    expect(isTaskId('undefined')).toBe(false);
    expect(isTaskId(`${ID}?x=1`)).toBe(false);
  });
});

describe('parseAssignRequest (C4)', () => {
  const body = { questions: [{ id: ID, question: 'Q' }], availableSubjects: ['Anatomie'] };

  it('returns the questions, their unique ids and the subjects', () => {
    const parsed = parseAssignRequest({
      ...body,
      questions: [body.questions[0], body.questions[0]],
    });
    expect(parsed.ok && parsed.questionIds).toEqual([ID]);
  });

  it('ignores a userId in the body', () => {
    const parsed = parseAssignRequest({ ...body, userId: 'someone-else' });
    expect(parsed.ok).toBe(true);
    expect(parsed).not.toHaveProperty('userId');
  });

  it('refuses questions without a valid id', () => {
    expect(parseAssignRequest({ ...body, questions: [{ id: 'x' }] }).ok).toBe(false);
    expect(parseAssignRequest({ ...body, questions: [] }).ok).toBe(false);
  });

  it('caps the number of questions per job', () => {
    const many = Array.from({ length: MAX_ASSIGN_QUESTIONS + 1 }, () => ({ id: ID }));
    expect(parseAssignRequest({ ...body, questions: many }).ok).toBe(false);
  });

  it('refuses empty or malformed subjects', () => {
    expect(parseAssignRequest({ ...body, availableSubjects: [] }).ok).toBe(false);
    expect(parseAssignRequest({ ...body, availableSubjects: [''] }).ok).toBe(false);
    expect(parseAssignRequest({ ...body, availableSubjects: 'Anatomie' }).ok).toBe(false);
  });
});

describe('parseReassignRequest (C4)', () => {
  const body = { examName: ' Physikum ', universityId: UNI, availableSubjects: ['Anatomie'] };

  it('accepts a real university id', () => {
    const parsed = parseReassignRequest(body);
    expect(parsed.ok && parsed.examName).toBe('Physikum');
  });

  it('refuses null and "all"', () => {
    expect(parseReassignRequest({ ...body, universityId: null }).ok).toBe(false);
    expect(parseReassignRequest({ ...body, universityId: 'all' }).ok).toBe(false);
  });
});

describe('cron functions deploy config (C3)', () => {
  // pg_cron sends x-cron-secret, not a JWT.
  it.each(['dispatch-next-ai-commentary-batch', 'reconcile-stuck-ai-commentary-jobs'])(
    '%s skips the verify_jwt gate',
    (name) => {
      const config = readFileSync('supabase/config.toml', 'utf8');
      expect(config).toMatch(new RegExp(`\\[functions\\.${name}\\]\\s*\\nverify_jwt = false`));
    },
  );
});
