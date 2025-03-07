
import { supabase } from '@/integrations/supabase/client';

/**
 * Records a user's answer to a question
 * @param userId - The ID of the user
 * @param questionId - The ID of the question
 * @param userAnswer - The user's answer
 * @param isCorrect - Whether the answer is correct
 * @returns A boolean indicating success
 */
export const recordAnswer = async (
  userId: string,
  questionId: string,
  userAnswer: string,
  isCorrect: boolean
): Promise<boolean> => {
  // Check if the user has already answered this question
  const { data: existingProgress, error: checkError } = await supabase
    .from('user_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('question_id', questionId)
    .maybeSingle();

  if (checkError) throw checkError;

  if (existingProgress) {
    // Update existing record
    const { error: updateError } = await supabase
      .from('user_progress')
      .update({
        user_answer: userAnswer,
        is_correct: isCorrect,
        attempts_count: (existingProgress.attempts_count || 1) + 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', existingProgress.id);

    if (updateError) throw updateError;
  } else {
    // Create new record
    const { error: insertError } = await supabase
      .from('user_progress')
      .insert({
        user_id: userId,
        question_id: questionId,
        user_answer: userAnswer,
        is_correct: isCorrect,
        attempts_count: 1
      });

    if (insertError) throw insertError;
  }

  return true;
};

/**
 * Fetches a user's progress on a question
 * @param userId - The ID of the user
 * @param questionId - The ID of the question
 * @returns The user's progress on the question
 */
export const fetchUserProgress = async (userId: string, questionId: string) => {
  const { data, error } = await supabase
    .from('user_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('question_id', questionId)
    .maybeSingle();

  if (error) throw error;
  return data;
};
