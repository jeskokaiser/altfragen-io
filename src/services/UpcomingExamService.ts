import { supabase } from '@/integrations/supabase/client';
import {
  UpcomingExam,
  UpcomingExamQuestionLink,
  UpcomingExamWithStats,
  QuestionSource,
} from '@/types/UpcomingExam';
import type { Question } from '@/types/Question';
import { TrainingSessionService } from './TrainingSessionService';
import { mapQuestionRow } from './questionRowMapper';
import { fetchAllRows } from './fetchAllRows';

export interface CreateUpcomingExamInput {
  title: string;
  due_date: string; // ISO date
  description?: string | null;
  subject?: string | null;
  created_by: string;
  university_id?: string | null;
}

export const createUpcomingExam = async (input: CreateUpcomingExamInput): Promise<UpcomingExam> => {
  const { data, error } = await supabase
    .from('upcoming_exams')
    .insert({
      title: input.title,
      due_date: input.due_date,
      description: input.description ?? null,
      subject: input.subject ?? null,
      created_by: input.created_by,
      university_id: input.university_id ?? null,
    })
    .select('*')
    .single();

  if (error) throw error;
  return data as UpcomingExam;
};

export const updateUpcomingExam = async (
  examId: string,
  updates: Partial<Omit<UpcomingExam, 'id' | 'created_by' | 'created_at' | 'updated_at'>>,
): Promise<UpcomingExam> => {
  const { data, error } = await supabase
    .from('upcoming_exams')
    .update(updates)
    .eq('id', examId)
    .select('*')
    .single();
  if (error) throw error;
  return data as UpcomingExam;
};

export const deleteUpcomingExam = async (examId: string): Promise<void> => {
  const { error } = await supabase.from('upcoming_exams').delete().eq('id', examId);
  if (error) throw error;
};

/** The exam with this ID, or null if there is none the user may read. */
export const fetchUpcomingExam = async (examId: string): Promise<UpcomingExam | null> => {
  const { data, error } = await supabase
    .from('upcoming_exams')
    .select('*')
    .eq('id', examId)
    .maybeSingle();

  if (error) throw error;
  return data as UpcomingExam | null;
};

/**
 * The names in an exam's `exam_name`. An exam linked to several exam names
 * stores them comma-separated, and links every question carrying one of them.
 */
export const splitExamNames = (examName: string | null): string[] =>
  (examName ?? '')
    .split(',')
    .map((name) => name.trim())
    .filter(Boolean);

/**
 * The questions an exam links: every question whose exam_name is one of
 * `examNames` (see `splitExamNames`), whoever owns it -- RLS decides which of
 * them the user may see.
 */
export const fetchQuestionsForExamNames = async (examNames: string[]): Promise<Question[]> => {
  if (examNames.length === 0) return [];

  const { data, error } = await supabase.from('questions').select('*').in('exam_name', examNames);

  if (error) throw error;
  return (data ?? []).map(mapQuestionRow);
};

/** Which questions an exam-name list is drawn from, per tab of the selector. */
export type ExamNameScope =
  | { visibility: 'private'; userId: string }
  | { visibility: 'university'; universityId: string }
  | { visibility: 'public' };

export interface ExamNameCount {
  exam_name: string;
  count: number;
}

/** The filters that narrow a `questions` query to the scope. */
const scopeFilters = (
  scope: ExamNameScope,
): {
  equal: Array<['user_id' | 'university_id' | 'visibility', string]>;
  isNull: Array<'university_id'>;
} => {
  switch (scope.visibility) {
    case 'private':
      return {
        equal: [
          ['user_id', scope.userId],
          ['visibility', 'private'],
        ],
        isNull: [],
      };
    case 'university':
      return {
        equal: [
          ['university_id', scope.universityId],
          ['visibility', 'university'],
        ],
        isNull: [],
      };
    case 'public':
      return { equal: [['visibility', 'public']], isNull: ['university_id'] };
  }
};

/**
 * The exam names in a scope, with how many questions carry each, sorted by
 * name -- what an exam can be linked to.
 *
 * Counted from the rows themselves, in one read -- this used to be one read
 * for the names and one count per name. The read is paged, because one
 * university has more questions with an exam name than the API returns in one
 * response.
 */
export const listExamNameCounts = async (scope: ExamNameScope): Promise<ExamNameCount[]> => {
  const { equal, isNull } = scopeFilters(scope);

  const rows = await fetchAllRows((from, to) => {
    let query = supabase
      .from('questions')
      .select('exam_name', { count: 'exact' })
      .not('exam_name', 'is', null);
    equal.forEach(([column, value]) => (query = query.eq(column, value)));
    isNull.forEach((column) => (query = query.is(column, null)));
    return query.order('id').range(from, to);
  });

  const counts = new Map<string, number>();
  rows.forEach(({ exam_name }) => {
    if (exam_name) counts.set(exam_name, (counts.get(exam_name) ?? 0) + 1);
  });

  return [...counts]
    .map(([exam_name, count]) => ({ exam_name, count }))
    .sort((a, b) => a.exam_name.localeCompare(b.exam_name));
};

/**
 * The user's exam that links questions named `examName`, or null. If several
 * do, the one due first.
 *
 * Matching the whole `exam_name` column is not enough: an exam linked to
 * several names would never match, and neither would two exams sharing a name.
 */
export const findUpcomingExamByExamName = async (
  userId: string,
  examName: string,
): Promise<Pick<UpcomingExam, 'id' | 'title' | 'exam_name'> | null> => {
  const { data, error } = await supabase
    .from('upcoming_exams')
    .select('id, title, exam_name')
    .eq('created_by', userId)
    .not('exam_name', 'is', null)
    .order('due_date', { ascending: true });

  if (error) throw error;
  return (data ?? []).find((exam) => splitExamNames(exam.exam_name).includes(examName)) ?? null;
};

/** The exams with these IDs. An ID that matches no exam is simply absent. */
export const fetchUpcomingExamsByIds = async (examIds: string[]): Promise<UpcomingExam[]> => {
  if (examIds.length === 0) return [];

  const { data, error } = await supabase.from('upcoming_exams').select('*').in('id', examIds);

  if (error) throw error;
  return (data ?? []) as UpcomingExam[];
};

export const findUpcomingExamByTitle = async (
  userId: string,
  title: string,
): Promise<UpcomingExam | null> => {
  const { data, error } = await supabase
    .from('upcoming_exams')
    .select('*')
    .eq('created_by', userId)
    .eq('title', title)
    .order('due_date', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data as UpcomingExam | null;
};

export const listUpcomingExamsForUser = async (
  userId: string,
): Promise<UpcomingExamWithStats[]> => {
  const { data: exams, error } = await supabase
    .from('upcoming_exams')
    .select('*')
    .eq('created_by', userId)
    .order('due_date', { ascending: true });
  if (error) throw error;

  if (!exams || exams.length === 0) return [];

  // Get all unique exam_names from exams (handle comma-separated values)
  const allExamNames = new Set<string>();
  (exams as UpcomingExam[]).forEach((exam) => {
    if (exam.exam_name) {
      // Split comma-separated exam_names
      exam.exam_name.split(',').forEach((name: string) => {
        const trimmed = name.trim();
        if (trimmed) {
          allExamNames.add(trimmed);
        }
      });
    }
  });

  // Count questions by exam_name in a single query
  const countByExamName: Record<string, number> = {};

  if (allExamNames.size > 0) {
    // Query all questions with matching exam_names
    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select('exam_name')
      .in('exam_name', Array.from(allExamNames));

    if (questionsError) {
      console.error('Error counting questions by exam_name:', questionsError);
    } else if (questions) {
      // Count questions per exam_name
      questions.forEach((q) => {
        const examName = q.exam_name;
        if (examName) {
          countByExamName[examName] = (countByExamName[examName] || 0) + 1;
        }
      });
    }
  }

  // Map counts to exam IDs (sum counts for all exam_names in comma-separated string)
  const countByExam: Record<string, number> = {};
  (exams as UpcomingExam[]).forEach((exam) => {
    if (exam.exam_name) {
      // Split comma-separated exam_names and sum their counts
      const names = exam.exam_name
        .split(',')
        .map((n: string) => n.trim())
        .filter(Boolean);
      const totalCount = names.reduce((sum, name) => sum + (countByExamName[name] || 0), 0);
      countByExam[exam.id] = totalCount;
    } else {
      countByExam[exam.id] = 0;
    }
  });

  return (exams as UpcomingExam[]).map((e) => ({
    ...e,
    linked_question_count: countByExam[e.id] || 0,
  }));
};

export const getLinkedQuestionIdsForExam = async (
  examId: string,
  userId?: string,
): Promise<Array<{ question_id: string; source: QuestionSource }>> => {
  // Get the exam to find its exam_name(s)
  const { data: exam, error: examError } = await supabase
    .from('upcoming_exams')
    .select('exam_name')
    .eq('id', examId)
    .single();

  if (examError) throw examError;
  if (!exam?.exam_name) return [];

  // Split comma-separated exam_names
  const examNames = exam.exam_name
    .split(',')
    .map((n: string) => n.trim())
    .filter(Boolean);
  if (examNames.length === 0) return [];

  // Query questions by exam_name (any of the selected exam_names)
  const { data: questions, error } = await supabase
    .from('questions')
    .select('id, visibility, user_id')
    .in('exam_name', examNames);

  if (error) throw error;
  if (!questions || questions.length === 0) return [];

  // Derive source from question properties
  return questions.map((q) => {
    const isPersonal = q.visibility === 'private' || (userId && q.user_id === userId);
    return {
      question_id: q.id as string,
      source: (isPersonal ? 'personal' : 'university') as QuestionSource,
    };
  });
};

export const linkQuestionsToExam = async (
  examId: string,
  questionIds: string[],
  questionIdToSource: (qid: string) => QuestionSource,
): Promise<UpcomingExamQuestionLink[]> => {
  // Questions are now automatically linked by exam_name matching
  // This function is kept for backward compatibility but is a no-op
  // Return derived links for compatibility
  if (questionIds.length === 0) return [];

  // Get the exam to find its exam_name
  const { data: exam, error: examError } = await supabase
    .from('upcoming_exams')
    .select('exam_name')
    .eq('id', examId)
    .single();

  if (examError) throw examError;
  if (!exam?.exam_name) return [];

  // Return derived links (questions are automatically linked by exam_name)
  return questionIds.map((qid) => ({
    exam_id: examId,
    question_id: qid,
    source: questionIdToSource(qid),
    created_at: new Date().toISOString(),
  }));
};

export const unlinkQuestionFromExam = async (
  _examId: string,
  _questionId: string,
): Promise<void> => {
  // Questions are now automatically linked by exam_name matching
  // Unlinking would require changing the question's exam_name, which is not desired
  // This function is kept for backward compatibility but is a no-op
  // To unlink, the question's exam_name would need to be changed, which should be done explicitly
};

export interface ExamUserStats {
  total_linked: number;
  answered: number;
  correct: number;
  percent_correct: number;
}

export const getExamStatsForUser = async (
  examId: string,
  userId: string,
): Promise<ExamUserStats> => {
  // Get the exam to find its exam_name(s)
  const { data: exam, error: examError } = await supabase
    .from('upcoming_exams')
    .select('exam_name')
    .eq('id', examId)
    .single();

  if (examError) throw examError;
  if (!exam?.exam_name) {
    return { total_linked: 0, answered: 0, correct: 0, percent_correct: 0 };
  }

  // Split comma-separated exam_names
  const examNames = exam.exam_name
    .split(',')
    .map((n: string) => n.trim())
    .filter(Boolean);
  if (examNames.length === 0) {
    return { total_linked: 0, answered: 0, correct: 0, percent_correct: 0 };
  }

  // Get linked questions by exam_name (any of the selected exam_names)
  const { data: questions, error: questionsErr } = await supabase
    .from('questions')
    .select('id')
    .in('exam_name', examNames);

  if (questionsErr) throw questionsErr;

  const questionIds: string[] = (questions || []).map((q) => q.id);
  const totalLinked = questionIds.length;
  if (totalLinked === 0) {
    return { total_linked: 0, answered: 0, correct: 0, percent_correct: 0 };
  }

  // Only sessions started from this exam count, and one-off runs not at all.
  const linkedSessionIds = await TrainingSessionService.listIdsForExam(userId, examId);
  const results = await TrainingSessionService.fetchLatestResults(
    userId,
    linkedSessionIds,
    questionIds,
  );

  const answered = results.size;
  const correct = [...results.values()].filter((isCorrect) => isCorrect === true).length;
  const percent_correct = answered > 0 ? Math.round((correct / answered) * 100) : 0;

  return { total_linked: totalLinked, answered, correct, percent_correct };
};
