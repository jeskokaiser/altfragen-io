
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
 * @param visibility - The visibility of the questions ('private', 'university', 'public')
 * @param universityId - The university ID (required if visibility = 'university')
 * @returns The saved questions
 */
export const saveQuestions = async (
  questions: Question[], 
  userId: string, 
  visibility: string = 'private',
  universityId?: string
): Promise<Question[]> => {
  try {
    const dbQuestions = questions.map(q => {
      const dbQuestion = mapQuestionToDatabaseQuestion(q, userId);
      // Add visibility and university_id
      dbQuestion.visibility = visibility;
      if (visibility === 'university' && universityId) {
        dbQuestion.university_id = universityId;
      }
      return dbQuestion;
    });
    
    // Insert questions individually to avoid type errors with array inserts
    for (const question of dbQuestions) {
      const { error } = await supabase
        .from('questions')
        .insert(question);
        
      if (error) throw new AppError(error.message, error);
    }

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
 * @param visibility - The visibility of the question
 * @param universityId - The university ID (required if visibility = 'university')
 * @returns The updated question
 */
export const updateQuestion = async (
  question: Question, 
  visibility?: string,
  universityId?: string
): Promise<Question> => {
  try {
    const dbQuestion = mapQuestionToDatabaseQuestion(question);
    
    // Update visibility and university_id if provided
    if (visibility) {
      dbQuestion.visibility = visibility;
      if (visibility === 'university' && universityId) {
        dbQuestion.university_id = universityId;
      } else if (visibility !== 'university') {
        dbQuestion.university_id = null;
      }
    }
    
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
