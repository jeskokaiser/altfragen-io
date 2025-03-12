
import { supabase } from '@/integrations/supabase/client';
import { UserPreferences } from '@/types/models/UserPreferences';

/**
 * Loads user preferences from the database
 * @param userId - The ID of the user
 * @returns The user preferences
 */
export const loadUserPreferences = async (userId: string): Promise<UserPreferences> => {
  const { data: existingPrefs, error: fetchError } = await supabase
    .from('user_preferences')
    .select()
    .eq('user_id', userId)
    .maybeSingle();

  if (fetchError && fetchError.code !== 'PGRST116') {
    throw fetchError;
  }

  if (existingPrefs) {
    return {
      immediateFeedback: existingPrefs.immediate_feedback,
      archivedDatasets: existingPrefs.archived_datasets || [],
      darkMode: existingPrefs.dark_mode || false
    };
  } else {
    // Create default preferences if none exist
    const defaultPreferences: UserPreferences = {
      immediateFeedback: false,
      archivedDatasets: [],
      darkMode: false
    };

    await createUserPreferences(userId, defaultPreferences);
    return defaultPreferences;
  }
};

/**
 * Creates user preferences in the database
 * @param userId - The ID of the user
 * @param preferences - The user preferences to create
 * @returns A boolean indicating success
 */
export const createUserPreferences = async (
  userId: string,
  preferences: UserPreferences
): Promise<boolean> => {
  const { error } = await supabase
    .from('user_preferences')
    .insert({
      user_id: userId,
      immediate_feedback: preferences.immediateFeedback,
      archived_datasets: preferences.archivedDatasets,
      dark_mode: preferences.darkMode
    });

  if (error) throw error;
  return true;
};

/**
 * Updates user preferences in the database
 * @param userId - The ID of the user
 * @param preferences - The user preferences to update
 * @returns A boolean indicating success
 */
export const updateUserPreferences = async (
  userId: string,
  preferences: Partial<UserPreferences>
): Promise<boolean> => {
  const updateData: Record<string, any> = {};
  
  if (preferences.immediateFeedback !== undefined) {
    updateData.immediate_feedback = preferences.immediateFeedback;
  }
  
  if (preferences.archivedDatasets !== undefined) {
    updateData.archived_datasets = preferences.archivedDatasets;
  }
  
  if (preferences.darkMode !== undefined) {
    updateData.dark_mode = preferences.darkMode;
  }
  
  updateData.updated_at = new Date().toISOString();

  const { error } = await supabase
    .from('user_preferences')
    .update(updateData)
    .eq('user_id', userId);

  if (error) throw error;
  return true;
};
