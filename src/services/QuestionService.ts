import { supabase } from '@/integrations/supabase/client';
import { Question } from '@/types/models/Question';
import { mapDatabaseQuestionToQuestion } from '@/utils/mappers/questionMappers';
import { AppError, handleApiError, logError } from '@/utils/errorHandler';

/**
 * Fetches all questions from the database that the user has access to
 * @returns A promise that resolves to an array of Questions
 * @throws {AppError} If there's an error fetching the questions
 */
export const fetchQuestions = async (): Promise<Question[]> => {
  try {
    console.log("Fetching questions from Supabase...");
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      logError(error, { source: 'fetchQuestions', message: error.message });
      throw new AppError(`Failed to fetch questions: ${error.message}`, error);
    }
    
    console.log(`Fetched ${data?.length || 0} questions`);
    return (data || []).map(mapDatabaseQuestionToQuestion);
  } catch (error) {
    console.error("Error in fetchQuestions:", error);
    throw handleApiError(error, 'Failed to fetch questions');
  }
};

/**
 * Fetches personal questions (created by the user) from the database
 * @param userId - The ID of the user
 * @returns A promise that resolves to an array of Questions
 * @throws {AppError} If there's an error fetching the questions
 */
export const fetchPersonalQuestions = async (userId: string): Promise<Question[]> => {
  try {
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      logError(error, { source: 'fetchPersonalQuestions', message: error.message });
      throw new AppError(`Failed to fetch personal questions: ${error.message}`, error);
    }
    
    return (data || []).map(mapDatabaseQuestionToQuestion);
  } catch (error) {
    throw handleApiError(error, 'Failed to fetch personal questions');
  }
};

/**
 * Fetches organizational questions (shared by users with the same domain) from the database
 * @returns A promise that resolves to an array of Questions
 * @throws {AppError} If there's an error fetching the questions
 */
export const fetchOrganizationalQuestions = async (): Promise<Question[]> => {
  try {
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .eq('visibility', 'organization')
      .order('created_at', { ascending: false });

    if (error) {
      logError(error, { source: 'fetchOrganizationalQuestions', message: error.message });
      throw new AppError(`Failed to fetch organizational questions: ${error.message}`, error);
    }
    
    return (data || []).map(mapDatabaseQuestionToQuestion);
  } catch (error) {
    throw handleApiError(error, 'Failed to fetch organizational questions');
  }
};

/**
 * Fetches the count of new questions answered today by a specific user
 * @param userId - The ID of the user
 * @returns A promise that resolves to the count of new questions answered today
 * @throws {AppError} If there's an error fetching the count
 */
export const fetchTodayNewCount = async (userId: string): Promise<number> => {
  if (!userId) {
    console.warn('fetchTodayNewCount called with no userId');
    return 0;
  }

  try {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    
    const { data, error } = await supabase
      .from('user_progress')
      .select('id')
      .eq('user_id', userId)
      .gte('created_at', today.toISOString());
    
    if (error) {
      logError(error, { source: 'fetchTodayNewCount', userId });
      throw new AppError(`Failed to fetch today's new count: ${error.message}`, error);
    }

    return data?.length ?? 0;
  } catch (error) {
    throw handleApiError(error, 'Failed to fetch today\'s new questions count');
  }
};

/**
 * Fetches the count of questions practiced today by a specific user
 * @param userId - The ID of the user
 * @returns A promise that resolves to the count of questions practiced today
 * @throws {AppError} If there's an error fetching the count
 */
export const fetchTodayPracticeCount = async (userId: string): Promise<number> => {
  if (!userId) {
    console.warn('fetchTodayPracticeCount called with no userId');
    return 0;
  }

  try {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    
    const { data, error } = await supabase
      .from('user_progress')
      .select('id')
      .eq('user_id', userId)
      .gte('updated_at', today.toISOString());
    
    if (error) {
      logError(error, { source: 'fetchTodayPracticeCount', userId });
      throw new AppError(`Failed to fetch today's practice count: ${error.message}`, error);
    }

    return data?.length ?? 0;
  } catch (error) {
    throw handleApiError(error, 'Failed to fetch today\'s practice count');
  }
};

/**
 * Fetches the total count of answered questions for a specific user
 * @param userId - The ID of the user
 * @returns A promise that resolves to the total count of answered questions
 * @throws {AppError} If there's an error fetching the count
 */
export const fetchTotalAnsweredCount = async (userId: string): Promise<number> => {
  if (!userId) {
    console.warn('fetchTotalAnsweredCount called with no userId');
    return 0;
  }

  try {
    const { count, error } = await supabase
      .from('user_progress')
      .select('*', { count: 'exact' })
      .eq('user_id', userId);
    
    if (error) {
      logError(error, { source: 'fetchTotalAnsweredCount', userId });
      throw new AppError(`Failed to fetch total answered count: ${error.message}`, error);
    }

    return count || 0;
  } catch (error) {
    console.error("Error in fetchTotalAnsweredCount:", error);
    throw handleApiError(error, 'Failed to fetch total answered count');
  }
};

/**
 * Fetches the total count of attempts for all questions by a specific user
 * @param userId - The ID of the user
 * @returns A promise that resolves to the total count of attempts
 * @throws {AppError} If there's an error fetching the count
 */
export const fetchTotalAttemptsCount = async (userId: string): Promise<number> => {
  if (!userId) {
    console.warn('fetchTotalAttemptsCount called with no userId');
    return 0;
  }

  try {
    const { data, error } = await supabase
      .from('user_progress')
      .select('attempts_count')
      .eq('user_id', userId);
    
    if (error) {
      logError(error, { source: 'fetchTotalAttemptsCount', userId });
      throw new AppError(`Failed to fetch total attempts count: ${error.message}`, error);
    }
    
    const totalAttempts = data.reduce((sum, record) => sum + (record.attempts_count || 1), 0);
    return totalAttempts;
  } catch (error) {
    console.error("Error in fetchTotalAttemptsCount:", error);
    throw handleApiError(error, 'Failed to fetch total attempts count');
  }
};
