
import { supabase } from '@/integrations/supabase/client';
import { Question } from '@/types/Question';
import { mapDatabaseQuestionToQuestion } from '@/utils/mappers/questionMappers';
import { AppError, handleApiError } from '@/utils/errorHandler';

/**
 * Fetches all questions from the database
 * @returns A list of questions
 */
export const fetchQuestions = async (): Promise<Question[]> => {
  try {
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw new AppError(error.message, error);
    
    return (data || []).map(mapDatabaseQuestionToQuestion);
  } catch (error) {
    throw handleApiError(error, 'Failed to fetch questions');
  }
};

/**
 * Fetches the count of new questions answered today
 * @param userId - The ID of the user
 * @returns The count of new questions answered today
 */
export const fetchTodayNewCount = async (userId: string): Promise<number> => {
  try {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    
    const { data, error } = await supabase
      .from('user_progress')
      .select('id')
      .eq('user_id', userId)
      .gte('created_at', today.toISOString());
    
    if (error) throw new AppError(error.message, error);
    return data?.length ?? 0;
  } catch (error) {
    throw handleApiError(error, 'Failed to fetch today\'s new questions count');
  }
};

/**
 * Fetches the count of questions practiced today
 * @param userId - The ID of the user
 * @returns The count of questions practiced today
 */
export const fetchTodayPracticeCount = async (userId: string): Promise<number> => {
  try {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    
    const { data, error } = await supabase
      .from('user_progress')
      .select('id')
      .eq('user_id', userId)
      .gte('updated_at', today.toISOString());
    
    if (error) throw new AppError(error.message, error);
    return data?.length ?? 0;
  } catch (error) {
    throw handleApiError(error, 'Failed to fetch today\'s practice count');
  }
};

/**
 * Fetches the total count of answered questions
 * @param userId - The ID of the user
 * @returns The total count of answered questions
 */
export const fetchTotalAnsweredCount = async (userId: string): Promise<number> => {
  try {
    const { count, error } = await supabase
      .from('user_progress')
      .select('*', { count: 'exact' })
      .eq('user_id', userId);
    
    if (error) throw new AppError(error.message, error);
    return count || 0;
  } catch (error) {
    throw handleApiError(error, 'Failed to fetch total answered count');
  }
};

/**
 * Fetches the total count of attempts for all questions
 * @param userId - The ID of the user
 * @returns The total count of attempts
 */
export const fetchTotalAttemptsCount = async (userId: string): Promise<number> => {
  try {
    const { data, error } = await supabase
      .from('user_progress')
      .select('attempts_count')
      .eq('user_id', userId);
    
    if (error) throw new AppError(error.message, error);
    
    const totalAttempts = data.reduce((sum, record) => sum + (record.attempts_count || 1), 0);
    return totalAttempts;
  } catch (error) {
    throw handleApiError(error, 'Failed to fetch total attempts count');
  }
};
