import { supabase } from '@/integrations/supabase/client';

export const deleteUserAccount = async (userId: string) => {
  try {
    // Delete private questions only (keep public ones)
    const { error: questionsError } = await supabase
      .from('questions')
      .delete()
      .eq('user_id', userId)
      .neq('visibility', 'public');

    if (questionsError) {
      console.error('Error deleting private questions:', questionsError);
      throw questionsError;
    }

    // Delete user progress
    const { error: progressError } = await supabase
      .from('user_progress')
      .delete()
      .eq('user_id', userId);

    if (progressError) {
      console.error('Error deleting user progress:', progressError);
      throw progressError;
    }

    // Delete user preferences
    const { error: preferencesError } = await supabase
      .from('user_preferences')
      .delete()
      .eq('user_id', userId);

    if (preferencesError) {
      console.error('Error deleting user preferences:', preferencesError);
      throw preferencesError;
    }

    // Delete AI comment usage
    const { error: usageError } = await supabase
      .from('user_ai_comment_usage')
      .delete()
      .eq('user_id', userId);

    if (usageError) {
      console.error('Error deleting AI comment usage:', usageError);
      throw usageError;
    }

    // Delete profile
    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (profileError) {
      console.error('Error deleting profile:', profileError);
      throw profileError;
    }

    // Finally, delete the auth user
    const { error: authError } = await supabase.auth.admin.deleteUser(userId);

    if (authError) {
      console.error('Error deleting auth user:', authError);
      throw authError;
    }

    return { success: true };
  } catch (error) {
    console.error('Error deleting account:', error);
    return { success: false, error };
  }
};
