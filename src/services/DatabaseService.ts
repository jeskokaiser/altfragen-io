
import { supabase } from '@/integrations/supabase/client';
import { Question } from '@/types/Question';
import { AppError, handleApiError } from '@/utils/errorHandler';
import { 
  mapQuestionToDatabaseQuestion,
  mapDatabaseQuestionToQuestion
} from '@/utils/mappers/questionMappers';

/**
 * Saves questions to the database
 * @param questions - The questions to save
 * @param userId - The ID of the user
 * @returns The saved questions
 */
export const saveQuestions = async (questions: Question[], userId: string): Promise<Question[]> => {
  try {
    const dbQuestions = questions.map(q => mapQuestionToDatabaseQuestion(q, userId));
    
    // Fix: Change from array insert to individual inserts or properly type the array
    const { error } = await supabase
      .from('questions')
      .insert(dbQuestions);

    if (error) throw new AppError(error.message, error);

    const { data: insertedQuestions, error: fetchError } = await supabase
      .from('questions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(questions.length);

    if (fetchError) throw new AppError(fetchError.message, fetchError);

    return (insertedQuestions || []).map(mapDatabaseQuestionToQuestion);
  } catch (error) {
    throw handleApiError(error, 'Failed to save questions');
  }
};

/**
 * Updates a question in the database
 * @param question - The question to update
 * @returns The updated question
 */
export const updateQuestion = async (question: Question): Promise<Question> => {
  try {
    const dbQuestion = mapQuestionToDatabaseQuestion(question);
    
    const { error } = await supabase
      .from('questions')
      .update(dbQuestion)
      .eq('id', question.id);

    if (error) throw new AppError(error.message, error);
    return question;
  } catch (error) {
    throw handleApiError(error, 'Failed to update question');
  }
};

/**
 * Marks a question as unclear in the database
 * @param questionId - The ID of the question
 * @param isUnclear - Whether the question is unclear
 * @returns A boolean indicating success
 */
export const markQuestionUnclear = async (questionId: string, isUnclear: boolean): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('questions')
      .update({
        is_unclear: isUnclear,
        marked_unclear_at: isUnclear ? new Date().toISOString() : null
      })
      .eq('id', questionId);

    if (error) throw new AppError(error.message, error);
    return true;
  } catch (error) {
    throw handleApiError(error, 'Failed to mark question as unclear');
  }
};
