
import { supabase } from '@/integrations/supabase/client';
import { Question } from '@/types/Question';

/**
 * Fetches all questions from the database
 * @returns An array of Question objects
 */
export const fetchQuestions = async (): Promise<Question[]> => {
  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  
  return (data || []).map(q => ({
    id: q.id,
    question: q.question,
    optionA: q.option_a,
    optionB: q.option_b,
    optionC: q.option_c,
    optionD: q.option_d,
    optionE: q.option_e,
    subject: q.subject,
    correctAnswer: q.correct_answer,
    comment: q.comment,
    filename: q.filename,
    created_at: q.created_at,
    difficulty: q.difficulty,
    is_unclear: q.is_unclear,
    marked_unclear_at: q.marked_unclear_at
  })) as Question[];
};

/**
 * Fetches the count of new questions answered today by a user
 * @param userId - The ID of the user
 * @returns The count of new questions answered today
 */
export const fetchTodayNewCount = async (userId?: string): Promise<number> => {
  if (!userId) return 0;
  
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  
  const { data, error } = await supabase
    .from('user_progress')
    .select('id')
    .eq('user_id', userId)
    .gte('created_at', today.toISOString());
  
  if (error) throw error;
  return data?.length ?? 0;
};

/**
 * Fetches the count of questions practiced today by a user
 * @param userId - The ID of the user
 * @returns The count of questions practiced today
 */
export const fetchTodayPracticeCount = async (userId?: string): Promise<number> => {
  if (!userId) return 0;
  
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  
  const { data, error } = await supabase
    .from('user_progress')
    .select('id')
    .eq('user_id', userId)
    .gte('updated_at', today.toISOString());
  
  if (error) throw error;
  return data?.length ?? 0;
};

/**
 * Fetches the total count of answers by a user
 * @param userId - The ID of the user
 * @returns The total count of answers
 */
export const fetchTotalAnsweredCount = async (userId?: string): Promise<number> => {
  if (!userId) return 0;
  
  const { count, error } = await supabase
    .from('user_progress')
    .select('*', { count: 'exact' })
    .eq('user_id', userId);
  
  if (error) throw error;
  return count || 0;
};

/**
 * Fetches the total count of attempts by a user
 * @param userId - The ID of the user
 * @returns The total count of attempts
 */
export const fetchTotalAttemptsCount = async (userId?: string): Promise<number> => {
  if (!userId) return 0;
  
  const { data, error } = await supabase
    .from('user_progress')
    .select('attempts_count')
    .eq('user_id', userId);
  
  if (error) throw error;
  return data.reduce((sum, record) => sum + (record.attempts_count || 1), 0);
};
