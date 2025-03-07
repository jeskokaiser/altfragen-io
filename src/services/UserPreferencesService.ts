
import { supabase } from '@/integrations/supabase/client';
import { UserPreferences } from '@/types/UserPreferences';

/**
 * Fetches a user's preferences
 * @param userId - The ID of the user
 * @returns The user's preferences
 */
export const fetchUserPreferences = async (userId: string): Promise<UserPreferences | null> => {
  const { data, error } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  
  if (!data) return null;
  
  return {
    immediateFeedback: data.immediate_feedback || false,
    archivedDatasets: data.archived_datasets || []
  };
};

/**
 * Updates a user's preferences
 * @param userId - The ID of the user
 * @param preferences - The preferences to update
 * @returns A boolean indicating success
 */
export const updateUserPreferences = async (
  userId: string, 
  preferences: Partial<UserPreferences>
): Promise<boolean> => {
  const { error: checkError, data: existingPrefs } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (checkError) throw checkError;

  if (existingPrefs) {
    // Update existing preferences
    const { error } = await supabase
      .from('user_preferences')
      .update({
        immediate_feedback: preferences.immediateFeedback !== undefined 
          ? preferences.immediateFeedback 
          : existingPrefs.immediate_feedback,
        archived_datasets: preferences.archivedDatasets || existingPrefs.archived_datasets,
        updated_at: new Date().toISOString()
      })
      .eq('id', existingPrefs.id);

    if (error) throw error;
  } else {
    // Create new preferences
    const { error } = await supabase
      .from('user_preferences')
      .insert({
        user_id: userId,
        immediate_feedback: preferences.immediateFeedback || false,
        archived_datasets: preferences.archivedDatasets || []
      });

    if (error) throw error;
  }

  return true;
};

/**
 * Archives a dataset for a user
 * @param userId - The ID of the user
 * @param filename - The filename to archive
 * @returns A boolean indicating success
 */
export const archiveDataset = async (userId: string, filename: string): Promise<boolean> => {
  const { data: existingPrefs, error: checkError } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (checkError) throw checkError;

  if (!existingPrefs) {
    // Create new preferences with archived dataset
    const { error } = await supabase
      .from('user_preferences')
      .insert({
        user_id: userId,
        immediate_feedback: false,
        archived_datasets: [filename]
      });

    if (error) throw error;
  } else {
    // Update existing preferences with new archived dataset
    const archivedDatasets = [...(existingPrefs.archived_datasets || [])];
    if (!archivedDatasets.includes(filename)) {
      archivedDatasets.push(filename);
    }

    const { error } = await supabase
      .from('user_preferences')
      .update({
        archived_datasets: archivedDatasets,
        updated_at: new Date().toISOString()
      })
      .eq('id', existingPrefs.id);

    if (error) throw error;
  }

  return true;
};

/**
 * Restores an archived dataset for a user
 * @param userId - The ID of the user
 * @param filename - The filename to restore
 * @returns A boolean indicating success
 */
export const restoreDataset = async (userId: string, filename: string): Promise<boolean> => {
  const { data: existingPrefs, error: checkError } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (checkError) throw checkError;

  if (!existingPrefs) return true; // Nothing to restore

  // Update archived datasets by removing the filename
  const archivedDatasets = (existingPrefs.archived_datasets || []).filter(
    (name) => name !== filename
  );

  const { error } = await supabase
    .from('user_preferences')
    .update({
      archived_datasets: archivedDatasets,
      updated_at: new Date().toISOString()
    })
    .eq('id', existingPrefs.id);

  if (error) throw error;
  return true;
};
