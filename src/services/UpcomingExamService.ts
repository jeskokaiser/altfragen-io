import { supabase } from '@/integrations/supabase/client';
import { UpcomingExam, UpcomingExamQuestionLink, UpcomingExamWithStats, QuestionSource } from '@/types/UpcomingExam';

const sb: any = supabase as any; // Temporary: widen typing until Supabase types include upcoming_exams

export interface CreateUpcomingExamInput {
  title: string;
  due_date: string; // ISO date
  description?: string | null;
  subject?: string | null;
  created_by: string;
  university_id?: string | null;
}

export const createUpcomingExam = async (input: CreateUpcomingExamInput): Promise<UpcomingExam> => {
  const { data, error } = await sb
    .from('upcoming_exams')
    .insert({
      title: input.title,
      due_date: input.due_date,
      description: input.description ?? null,
      subject: input.subject ?? null,
      created_by: input.created_by,
      university_id: input.university_id ?? null
    })
    .select('*')
    .single();

  if (error) throw error;
  return data as UpcomingExam;
};

export const updateUpcomingExam = async (examId: string, updates: Partial<Omit<UpcomingExam, 'id' | 'created_by' | 'created_at' | 'updated_at'>>): Promise<UpcomingExam> => {
  const { data, error } = await sb
    .from('upcoming_exams')
    .update(updates)
    .eq('id', examId)
    .select('*')
    .single();
  if (error) throw error;
  return data as UpcomingExam;
};

export const deleteUpcomingExam = async (examId: string): Promise<void> => {
  const { error } = await sb
    .from('upcoming_exams')
    .delete()
    .eq('id', examId);
  if (error) throw error;
};

export const listUpcomingExamsForUser = async (userId: string): Promise<UpcomingExamWithStats[]> => {
  const { data: exams, error } = await sb
    .from('upcoming_exams')
    .select('*')
    .eq('created_by', userId)
    .order('due_date', { ascending: true });
  if (error) throw error;

  const examIds = (exams || []).map((e: UpcomingExam) => e.id);
  if (examIds.length === 0) return [];

  const { data: links, error: linksErr } = await sb
    .from('upcoming_exam_questions')
    .select('exam_id, question_id')
    .in('exam_id', examIds);
  if (linksErr) throw linksErr;

  const countByExam: Record<string, number> = {};
  (links || []).forEach((l: { exam_id: string }) => {
    countByExam[l.exam_id] = (countByExam[l.exam_id] || 0) + 1;
  });

  return (exams as UpcomingExam[]).map((e) => ({
    ...e,
    linked_question_count: countByExam[e.id] || 0
  }));
};

export const getLinkedQuestionIdsForExam = async (examId: string): Promise<Array<{ question_id: string; source: QuestionSource }>> => {
  const { data, error } = await sb
    .from('upcoming_exam_questions')
    .select('question_id, source')
    .eq('exam_id', examId);
  if (error) throw error;
  return (data || []).map((r: any) => ({ question_id: r.question_id as string, source: r.source as QuestionSource }));
};

export const linkQuestionsToExam = async (
  examId: string,
  questionIds: string[],
  questionIdToSource: (qid: string) => QuestionSource
): Promise<UpcomingExamQuestionLink[]> => {
  const rows = questionIds.map((qid) => ({
    exam_id: examId,
    question_id: qid,
    source: questionIdToSource(qid)
  }));

  if (rows.length === 0) return [];

  const { data, error } = await sb
    .from('upcoming_exam_questions')
    .insert(rows)
    .select('*');
  if (error) throw error;
  return data as UpcomingExamQuestionLink[];
};

export const unlinkQuestionFromExam = async (examId: string, questionId: string): Promise<void> => {
  const { error } = await sb
    .from('upcoming_exam_questions')
    .delete()
    .eq('exam_id', examId)
    .eq('question_id', questionId);
  if (error) throw error;
};

export interface ExamUserStats {
  total_linked: number;
  answered: number;
  correct: number;
  percent_correct: number;
}

export const getExamStatsForUser = async (examId: string, userId: string): Promise<ExamUserStats> => {
  // Get linked questions for the exam
  const { data: links, error: linksErr } = await sb
    .from('upcoming_exam_questions')
    .select('question_id')
    .eq('exam_id', examId);
  if (linksErr) throw linksErr;

  const questionIds: string[] = (links || []).map((l: any) => l.question_id);
  const totalLinked = questionIds.length;
  if (totalLinked === 0) {
    return { total_linked: 0, answered: 0, correct: 0, percent_correct: 0 };
  }

  // Fetch user progress from both tables in batches to avoid URL length limits
  const BATCH_SIZE = 300;
  const batches: string[][] = [];
  for (let i = 0; i < questionIds.length; i += BATCH_SIZE) {
    batches.push(questionIds.slice(i, i + BATCH_SIZE));
  }

  // Query both tables in parallel
  const batchPromises = batches.map(batch => {
    const userProgressPromise = sb
      .from('user_progress')
      .select('question_id, is_correct, updated_at, created_at')
      .eq('user_id', userId)
      .in('question_id', batch);

    const sessionProgressPromise = sb
      .from('session_question_progress')
      .select('question_id, is_correct, updated_at, created_at')
      .eq('user_id', userId)
      .in('question_id', batch);

    return Promise.all([userProgressPromise, sessionProgressPromise]);
  });

  const batchResults = await Promise.allSettled(batchPromises);
  
  // Process session_question_progress first (newer system, takes priority)
  const sessionProgress: Array<{ question_id: string; is_correct: boolean | null; ts: number }> = [];
  const userProgress: Array<{ question_id: string; is_correct: boolean | null; ts: number }> = [];
  
  batchResults.forEach(result => {
    if (result.status === 'fulfilled') {
      const [userProgressResult, sessionProgressResult] = result.value;
      
      // Process session_question_progress entries (take latest per question per batch)
      if (sessionProgressResult.data) {
        const sessionBatchMap = new Map<string, { is_correct: boolean | null; ts: number }>();
        sessionProgressResult.data.forEach((p: any) => {
          const qid = p.question_id as string;
          if (!qid) return;
          const ts = new Date(p.updated_at || p.created_at).getTime();
          const existing = sessionBatchMap.get(qid);
          if (!existing || ts > existing.ts) {
            sessionBatchMap.set(qid, { is_correct: p.is_correct, ts });
          }
        });
        sessionBatchMap.forEach((value, key) => {
          sessionProgress.push({ question_id: key, ...value });
        });
      }
      
      // Process user_progress entries (take latest per question per batch)
      if (userProgressResult.data) {
        const userBatchMap = new Map<string, { is_correct: boolean | null; ts: number }>();
        userProgressResult.data.forEach((p: any) => {
          const qid = p.question_id as string;
          if (!qid) return;
          const ts = new Date(p.updated_at || p.created_at).getTime();
          const existing = userBatchMap.get(qid);
          if (!existing || ts > existing.ts) {
            userBatchMap.set(qid, { is_correct: p.is_correct, ts });
          }
        });
        userBatchMap.forEach((value, key) => {
          userProgress.push({ question_id: key, ...value });
        });
      }
    }
  });

  // Merge: prioritize session_question_progress, fall back to user_progress
  const latestByQuestion: Record<string, { is_correct: boolean | null; ts: number }> = {};
  
  // First, add all session progress
  sessionProgress.forEach(p => {
    const qid = p.question_id;
    const existing = latestByQuestion[qid];
    if (!existing || p.ts > existing.ts) {
      latestByQuestion[qid] = { is_correct: p.is_correct, ts: p.ts };
    }
  });
  
  // Then, add user progress only if question not already present
  userProgress.forEach(p => {
    const qid = p.question_id;
    if (!latestByQuestion[qid] || p.ts > latestByQuestion[qid].ts) {
      latestByQuestion[qid] = { is_correct: p.is_correct, ts: p.ts };
    }
  });

  const answered = Object.keys(latestByQuestion).length;
  const correct = Object.values(latestByQuestion).filter(v => v.is_correct === true).length;
  const percent_correct = answered > 0 ? Math.round((correct / answered) * 100) : 0;

  return { total_linked: totalLinked, answered, correct, percent_correct };
};


