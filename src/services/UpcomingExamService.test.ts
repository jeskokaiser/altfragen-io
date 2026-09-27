import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  queriesFor,
  queueResponse,
  recordedQueries,
  resetSupabaseDouble,
} from '@/test/supabaseDouble';

vi.mock('@/integrations/supabase/client', async () => ({
  supabase: (await import('@/test/supabaseDouble')).supabaseDouble,
}));

import { fetchUpcomingExamsByIds } from './UpcomingExamService';

const exam = (id: string) => ({
  id,
  title: `Exam ${id}`,
  due_date: '2026-10-01',
  description: null,
  subject: null,
  exam_name: null,
  created_by: 'user-1',
  university_id: null,
  created_at: '2026-09-01T00:00:00Z',
  updated_at: '2026-09-01T00:00:00Z',
});

beforeEach(resetSupabaseDouble);

describe('fetchUpcomingExamsByIds', () => {
  it('asks for nothing when there are no IDs', async () => {
    // An `in` filter with an empty list is a wasted round trip at best.
    expect(await fetchUpcomingExamsByIds([])).toEqual([]);
    expect(recordedQueries).toHaveLength(0);
  });

  it('fetches exactly the requested exams', async () => {
    queueResponse('upcoming_exams', { data: [exam('e1'), exam('e2')] });

    const exams = await fetchUpcomingExamsByIds(['e1', 'e2']);

    expect(exams.map((found) => found.id)).toEqual(['e1', 'e2']);
    expect(queriesFor('upcoming_exams')[0].ops).toContainEqual({
      method: 'in',
      args: ['id', ['e1', 'e2']],
    });
  });

  it('leaves out an ID that matches no exam', async () => {
    // A session can outlive the exam it was created for.
    queueResponse('upcoming_exams', { data: [exam('e1')] });

    expect(await fetchUpcomingExamsByIds(['e1', 'deleted'])).toHaveLength(1);
  });

  it('throws on a failed read, so the caller decides how to degrade', async () => {
    queueResponse('upcoming_exams', { error: { message: 'boom' } });

    await expect(fetchUpcomingExamsByIds(['e1'])).rejects.toEqual({ message: 'boom' });
  });
});
