
import { supabase } from '@/integrations/supabase/client';
import { UserProgress } from '@/types/UserProgress';

/**
 * Records or updates a user's progress on a question
 * @param userId - The ID of the user
 * @param questionId - The ID of the question
 * @param isCorrect - Whether the answer was correct
 * @param userAnswer - The user's answer
 * @returns The updated user progress
 */
export const recordQuestionProgress = async (
  userId: string,
  questionId: string,
  isCorrect: boolean,
  userAnswer: string
): Promise<UserProgress> => {
  // Check if progress already exists
  const { data: existingProgress, error: fetchError } = await supabase
    .from('user_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('question_id', questionId)
    .maybeSingle();

  if (fetchError && fetchError.code !== 'PGRST116') {
    throw fetchError;
  }

  if (existingProgress) {
    // Update existing progress
    const { data, error } = await supabase
      .from('user_progress')
      .update({
        is_correct: isCorrect,
        user_answer: userAnswer,
        attempts_count: existingProgress.attempts_count + 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', existingProgress.id)
      .select()
      .single();

    if (error) throw error;
    
    return {
      id: data.id,
      userId: data.user_id,
      questionId: data.question_id,
      isCorrect: data.is_correct,
      userAnswer: data.user_answer,
      attemptsCount: data.attempts_count,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  } else {
    // Create new progress
    const { data, error } = await supabase
      .from('user_progress')
      .insert({
        user_id: userId,
        question_id: questionId,
        is_correct: isCorrect,
        user_answer: userAnswer,
        attempts_count: 1
      })
      .select()
      .single();

    if (error) throw error;
    
    return {
      id: data.id,
      userId: data.user_id,
      questionId: data.question_id,
      isCorrect: data.is_correct,
      userAnswer: data.user_answer,
      attemptsCount: data.attempts_count,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  }
};

/**
 * Fetches a user's progress for a specific question
 * @param userId - The ID of the user
 * @param questionId - The ID of the question
 * @returns The user progress or null if not found
 */
export const getQuestionProgress = async (
  userId: string,
  questionId: string
): Promise<UserProgress | null> => {
  const { data, error } = await supabase
    .from('user_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('question_id', questionId)
    .maybeSingle();

  if (error) throw error;
  
  if (!data) return null;
  
  return {
    id: data.id,
    userId: data.user_id,
    questionId: data.question_id,
    isCorrect: data.is_correct,
    userAnswer: data.user_answer,
    attemptsCount: data.attempts_count,
    createdAt: data.created_at,
    updatedAt: data.updated_at
  };
};

/**
 * Fetches a user's progress for multiple questions
 * @param userId - The ID of the user
 * @param questionIds - The IDs of the questions
 * @returns A map of question IDs to user progress
 */
export const getQuestionsProgress = async (
  userId: string,
  questionIds: string[]
): Promise<Map<string, UserProgress>> => {
  const { data, error } = await supabase
    .from('user_progress')
    .select('*')
    .eq('user_id', userId)
    .in('question_id', questionIds);

  if (error) throw error;
  
  const progressMap = new Map<string, UserProgress>();
  
  data?.forEach(item => {
    progressMap.set(item.question_id, {
      id: item.id,
      userId: item.user_id,
      questionId: item.question_id,
      isCorrect: item.is_correct,
      userAnswer: item.user_answer,
      attemptsCount: item.attempts_count,
      createdAt: item.created_at,
      updatedAt: item.updated_at
    });
  });
  
  return progressMap;
};
