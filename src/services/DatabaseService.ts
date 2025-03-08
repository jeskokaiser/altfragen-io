
import { supabase } from '@/integrations/supabase/client';
import { Question } from '@/types/models/Question';
import { AppError, handleApiError } from '@/utils/errorHandler';
import { 
  mapQuestionToDatabaseQuestion,
  mapDatabaseQuestionToQuestion
} from '@/utils/mappers/questionMappers';
import { ExtendedDatabaseQuestion } from '@/types/api/database';
import { getUserOrganization, isOrganizationWhitelisted } from './OrganizationService';

/**
 * Saves questions to the database
 * @param questions - The questions to save
 * @param userId - The ID of the user
 * @param visibility - The visibility of the questions ('private' or 'organization')
 * @returns The saved questions
 */
export const saveQuestions = async (
  questions: Question[], 
  userId: string, 
  visibility: 'private' | 'organization' = 'private'
): Promise<Question[]> => {
  try {
    // Get the user's organization ID
    const userOrg = await getUserOrganization(userId);
    const organizationId = userOrg?.id;
    
    // If trying to share with organization, check if organization is whitelisted
    if (visibility === 'organization' && organizationId) {
      const isWhitelisted = await isOrganizationWhitelisted(organizationId);
      if (!isWhitelisted) {
        throw new AppError('Your organization is not whitelisted for sharing', { code: 403 });
      }
    }
    
    const dbQuestions = questions.map(q => mapQuestionToDatabaseQuestion(
      q, 
      userId, 
      visibility, 
      visibility === 'organization' ? organizationId : null
    ));
    
    // Insert questions individually to avoid type errors with array inserts
    for (const question of dbQuestions) {
      const { error } = await supabase
        .from('questions')
        .insert(question as ExtendedDatabaseQuestion);
        
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
 * @returns The updated question
 */
export const updateQuestion = async (question: Question): Promise<Question> => {
  try {
    const dbQuestion = mapQuestionToDatabaseQuestion(question);
    
    const { error } = await supabase
      .from('questions')
      .update(dbQuestion as ExtendedDatabaseQuestion)
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

/**
 * Updates a question's visibility in the database
 * @param questionId - The ID of the question
 * @param visibility - The new visibility setting ('private' or 'organization')
 * @param userId - The ID of the user making the change
 * @returns A boolean indicating success
 */
export const updateQuestionVisibility = async (
  questionId: string, 
  visibility: 'private' | 'organization',
  userId: string
): Promise<boolean> => {
  try {
    // Get the user's organization ID
    const userOrg = await getUserOrganization(userId);
    const organizationId = userOrg?.id;
    
    // If trying to share with organization, check if organization is whitelisted
    if (visibility === 'organization' && organizationId) {
      const isWhitelisted = await isOrganizationWhitelisted(organizationId);
      if (!isWhitelisted) {
        throw new AppError('Your organization is not whitelisted for sharing', { code: 403 });
      }
    }
    
    const updateData: any = {
      visibility: visibility,
      organization_id: visibility === 'organization' ? organizationId : null
    };
    
    const { error } = await supabase
      .from('questions')
      .update(updateData)
      .eq('id', questionId)
      .eq('user_id', userId);  // Ensure user owns the question

    if (error) throw new AppError(error.message, error);
    return true;
  } catch (error) {
    throw handleApiError(error, 'Failed to update question visibility');
  }
};

/**
 * Updates the visibility of all questions in a dataset
 * @param filename - The filename of the dataset
 * @param visibility - The new visibility setting ('private' or 'organization')
 * @param userId - The ID of the user making the change
 * @returns A boolean indicating success
 */
export const updateDatasetVisibility = async (
  filename: string,
  visibility: 'private' | 'organization',
  userId: string
): Promise<boolean> => {
  try {
    // Get the user's organization ID
    const userOrg = await getUserOrganization(userId);
    const organizationId = userOrg?.id;
    
    // If trying to share with organization, check if organization is whitelisted
    if (visibility === 'organization' && organizationId) {
      const isWhitelisted = await isOrganizationWhitelisted(organizationId);
      if (!isWhitelisted) {
        throw new AppError('Your organization is not whitelisted for sharing', { code: 403 });
      }
    }
    
    const updateData: any = {
      visibility: visibility,
      organization_id: visibility === 'organization' ? organizationId : null
    };
    
    const { error } = await supabase
      .from('questions')
      .update(updateData)
      .eq('filename', filename)
      .eq('user_id', userId);  // Ensure user owns the questions

    if (error) throw new AppError(error.message, error);
    return true;
  } catch (error) {
    throw handleApiError(error, 'Failed to update dataset visibility');
  }
};
