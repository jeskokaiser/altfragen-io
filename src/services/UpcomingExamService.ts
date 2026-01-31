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

export const findUpcomingExamByTitle = async (userId: string, title: string): Promise<UpcomingExam | null> => {
  const { data, error } = await sb
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

export const listUpcomingExamsForUser = async (userId: string): Promise<UpcomingExamWithStats[]> => {
  const { data: exams, error } = await sb
    .from('upcoming_exams')
    .select('*')
    .eq('created_by', userId)
    .order('due_date', { ascending: true });
  if (error) throw error;

  if (!exams || exams.length === 0) return [];

  // Get all unique exam_names from exams (handle comma-separated values)
  const allExamNames = new Set<string>();
  (exams as UpcomingExam[]).forEach(exam => {
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
    const { data: questions, error: questionsError } = await sb
      .from('questions')
      .select('exam_name')
      .in('exam_name', Array.from(allExamNames));
    
    if (questionsError) {
      console.error('Error counting questions by exam_name:', questionsError);
    } else if (questions) {
      // Count questions per exam_name
      questions.forEach((q: any) => {
        const examName = q.exam_name;
        if (examName) {
          countByExamName[examName] = (countByExamName[examName] || 0) + 1;
        }
      });
    }
  }

  // Map counts to exam IDs (sum counts for all exam_names in comma-separated string)
  const countByExam: Record<string, number> = {};
  (exams as UpcomingExam[]).forEach(exam => {
    if (exam.exam_name) {
      // Split comma-separated exam_names and sum their counts
      const names = exam.exam_name.split(',').map((n: string) => n.trim()).filter(Boolean);
      const totalCount = names.reduce((sum, name) => sum + (countByExamName[name] || 0), 0);
      countByExam[exam.id] = totalCount;
    } else {
      countByExam[exam.id] = 0;
    }
  });

  return (exams as UpcomingExam[]).map((e) => ({
    ...e,
    linked_question_count: countByExam[e.id] || 0
  }));
};

export const getLinkedQuestionIdsForExam = async (examId: string, userId?: string): Promise<Array<{ question_id: string; source: QuestionSource }>> => {
  // Get the exam to find its exam_name(s)
  const { data: exam, error: examError } = await sb
    .from('upcoming_exams')
    .select('exam_name')
    .eq('id', examId)
    .single();
  
  if (examError) throw examError;
  if (!exam?.exam_name) return [];

  // Split comma-separated exam_names
  const examNames = exam.exam_name.split(',').map((n: string) => n.trim()).filter(Boolean);
  if (examNames.length === 0) return [];

  // Query questions by exam_name (any of the selected exam_names)
  const { data: questions, error } = await sb
    .from('questions')
    .select('id, visibility, user_id')
    .in('exam_name', examNames);
  
  if (error) throw error;
  if (!questions || questions.length === 0) return [];

  // Derive source from question properties
  return questions.map((q: any) => {
    const isPersonal = q.visibility === 'private' || (userId && q.user_id === userId);
    return {
      question_id: q.id as string,
      source: (isPersonal ? 'personal' : 'university') as QuestionSource
    };
  });
};

export const linkQuestionsToExam = async (
  examId: string,
  questionIds: string[],
  questionIdToSource: (qid: string) => QuestionSource
): Promise<UpcomingExamQuestionLink[]> => {
  // Questions are now automatically linked by exam_name matching
  // This function is kept for backward compatibility but is a no-op
  // Return derived links for compatibility
  if (questionIds.length === 0) return [];

  // Get the exam to find its exam_name
  const { data: exam, error: examError } = await sb
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
    created_at: new Date().toISOString()
  }));
};

export const unlinkQuestionFromExam = async (examId: string, questionId: string): Promise<void> => {
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

export const getExamStatsForUser = async (examId: string, userId: string): Promise<ExamUserStats> => {
  // Get the exam to find its exam_name(s)
  const { data: exam, error: examError } = await sb
    .from('upcoming_exams')
    .select('exam_name')
    .eq('id', examId)
    .single();
  
  if (examError) throw examError;
  if (!exam?.exam_name) {
    return { total_linked: 0, answered: 0, correct: 0, percent_correct: 0 };
  }

  // Split comma-separated exam_names
  const examNames = exam.exam_name.split(',').map((n: string) => n.trim()).filter(Boolean);
  if (examNames.length === 0) {
    return { total_linked: 0, answered: 0, correct: 0, percent_correct: 0 };
  }

  // Get linked questions by exam_name (any of the selected exam_names)
  const { data: questions, error: questionsErr } = await sb
    .from('questions')
    .select('id')
    .in('exam_name', examNames);
  
  if (questionsErr) throw questionsErr;

  const questionIds: string[] = (questions || []).map((q: any) => q.id);
  const totalLinked = questionIds.length;
  if (totalLinked === 0) {
    return { total_linked: 0, answered: 0, correct: 0, percent_correct: 0 };
  }

  // Fetch training sessions linked to this exam to filter session progress
  const { data: allSessions, error: sessionsErr } = await sb
    .from('training_sessions')
    .select('id, filter_settings')
    .eq('user_id', userId);
  
  if (sessionsErr) throw sessionsErr;
  
  // Get session IDs linked to this exam
  const linkedSessionIds = (allSessions || [])
    .filter((s: any) => {
      const fs = s.filter_settings as any;
      return fs && fs.source === 'exam' && fs.examId === examId;
    })
    .map((s: any) => s.id);

  // Fetch user progress from both tables in batches to avoid URL length limits
  const BATCH_SIZE = 300;
  const batches: string[][] = [];
  for (let i = 0; i < questionIds.length; i += BATCH_SIZE) {
    batches.push(questionIds.slice(i, i + BATCH_SIZE));
  }

  // Query session progress only (no user_progress fallback)
  const batchPromises = batches.map(batch => {
    // Filter session progress to only include sessions linked to this exam
    if (linkedSessionIds.length > 0) {
      return sb
        .from('session_question_progress')
        .select('question_id, is_correct, updated_at, created_at')
        .eq('user_id', userId)
        .in('question_id', batch)
        .in('session_id', linkedSessionIds);
    } else {
      // If no exam sessions, return empty result
      return Promise.resolve({ data: [], error: null });
    }
  });

  const batchResults = await Promise.allSettled(batchPromises);
  
  // Process session_question_progress only
  const sessionProgress: Array<{ question_id: string; is_correct: boolean | null; ts: number }> = [];
  
  batchResults.forEach(result => {
    if (result.status === 'fulfilled') {
      const sessionProgressResult = result.value;
      
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
    }
  });

  // Final deduplication across all batches to get the absolute latest per question
  const latestByQuestion: Record<string, { is_correct: boolean | null; ts: number }> = {};
  
  // Add all session progress and take the absolute latest per question
  sessionProgress.forEach(p => {
    const qid = p.question_id;
    const existing = latestByQuestion[qid];
    if (!existing || p.ts > existing.ts) {
      latestByQuestion[qid] = { is_correct: p.is_correct, ts: p.ts };
    }
  });

  const answered = Object.keys(latestByQuestion).length;
  const correct = Object.values(latestByQuestion).filter(v => v.is_correct === true).length;
  const percent_correct = answered > 0 ? Math.round((correct / answered) * 100) : 0;

  return { total_linked: totalLinked, answered, correct, percent_correct };
};


