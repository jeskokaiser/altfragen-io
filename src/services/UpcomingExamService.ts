import { supabase } from '@/integrations/supabase/client';
import {
  UpcomingExam,
  UpcomingExamQuestionLink,
  UpcomingExamWithStats,
  QuestionSource,
} from '@/types/UpcomingExam';
import { TrainingSessionService } from './TrainingSessionService';

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
