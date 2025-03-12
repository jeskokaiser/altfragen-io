
import { supabase } from '@/integrations/supabase/client';
import { UserProfile } from '@/types/models/UserProfile';
import { AppError, handleApiError } from '@/utils/errorHandler';

/**
 * Fetches the current user's profile
 * @returns Promise<UserProfile | null> A promise that resolves to the user's profile or null if not found
 */
export const fetchUserProfile = async (): Promise<UserProfile | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return null;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select(`
        *,
        university:universities(*)
      `)
      .eq('id', user.id)
      .maybeSingle();

    if (error) {
      throw new AppError(`Failed to fetch user profile: ${error.message}`, error);
    }

    return data;
  } catch (error) {
    throw handleApiError(error, 'Failed to fetch user profile');
  }
};

/**
 * Updates the user's university and verification status
 * @param userId The user's ID
 * @param universityId The university ID to assign
 * @param isVerified Whether the email is verified
 * @returns Promise<UserProfile | null> A promise that resolves to the updated profile
 */
export const updateUserUniversity = async (
  userId: string, 
  universityId: string | null, 
  isVerified: boolean = false
): Promise<UserProfile | null> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        university_id: universityId,
        is_email_verified: isVerified
      })
      .eq('id', userId)
      .select()
      .maybeSingle();

    if (error) {
      throw new AppError(`Failed to update user profile: ${error.message}`, error);
    }

    return data;
  } catch (error) {
    throw handleApiError(error, 'Failed to update user university');
  }
};
