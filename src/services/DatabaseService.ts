
import { supabase } from '@/integrations/supabase/client';
import { Question } from '@/types/models/Question';
import { AppError, handleApiError } from '@/utils/errorHandler';
import { 
  mapQuestionToDatabaseQuestion,
  mapDatabaseQuestionToQuestion
} from '@/utils/mappers/questionMappers';

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
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', userId)
      .single();
    
    if (profileError) throw new AppError(profileError.message, profileError);
    
    const organizationId = userProfile?.organization_id;
    
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
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', userId)
      .single();
    
    if (profileError) throw new AppError(profileError.message, profileError);
    
    const organizationId = userProfile?.organization_id;
    
    const { error } = await supabase
      .from('questions')
      .update({
        visibility: visibility,
        organization_id: visibility === 'organization' ? organizationId : null
      })
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
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', userId)
      .single();
    
    if (profileError) throw new AppError(profileError.message, profileError);
    
    const organizationId = userProfile?.organization_id;
    
    const { error } = await supabase
      .from('questions')
      .update({
        visibility: visibility,
        organization_id: visibility === 'organization' ? organizationId : null
      })
      .eq('filename', filename)
      .eq('user_id', userId);  // Ensure user owns the questions

    if (error) throw new AppError(error.message, error);
    return true;
  } catch (error) {
    throw handleApiError(error, 'Failed to update dataset visibility');
  }
};

/**
 * Gets the organization information for a user
 * @param userId - The ID of the user
 * @returns Organization information including domain
 */
export const getUserOrganization = async (userId: string): Promise<{ id: string, domain: string } | null> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('organization_id, email_domain')
      .eq('id', userId)
      .single();
    
    if (error) throw new AppError(error.message, error);
    
    if (!data?.organization_id) return null;
    
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('id, domain')
      .eq('id', data.organization_id)
      .single();
    
    if (orgError) throw new AppError(orgError.message, orgError);
    
    return org || null;
  } catch (error) {
    throw handleApiError(error, 'Failed to get user organization');
  }
};
