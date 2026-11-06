import { supabase } from '@/integrations/supabase/client';

export const updateUsername = async (userId: string, username: string | null): Promise<void> => {
  // Check uniqueness if username is provided
  if (username?.trim()) {
    const trimmedUsername = username.trim();
    const { data: existingProfile, error: checkError } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', trimmedUsername)
      .neq('id', userId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116 = no rows returned
      console.error('Error checking username uniqueness:', checkError);
      throw checkError;
    }

    if (existingProfile) {
      throw new Error('Dieser Benutzername ist bereits vergeben');
    }
  }

  const { error } = await supabase
    .from('profiles')
    .update({ username: username?.trim() || null })
    .eq('id', userId);

  if (error) {
    // Check if it's a unique constraint violation
    if (error.code === '23505' || error.message?.includes('unique')) {
      throw new Error('Dieser Benutzername ist bereits vergeben');
    }
    console.error('Error updating username:', error);
    throw error;
  }
};

/**
 * Deleting an account needs the service key, so it runs in the `delete-account`
 * Edge Function, which takes the user from the session rather than a parameter.
 */
export const deleteUserAccount = async (): Promise<{ success: boolean; error?: unknown }> => {
  const { error } = await supabase.functions.invoke('delete-account', {
    body: { confirm: 'DELETE' },
  });

  return error ? { success: false, error } : { success: true };
};
