
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { showToast } from '@/utils/toast';

interface LogoutResult {
  error: Error | null;
}

export const useLogout = () => {
  const [isLoading, setIsLoading] = useState(false);

  const logout = async (): Promise<LogoutResult> => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        showToast.error('Failed to log out');
        return { error };
      }
      
      showToast.success('Successfully logged out');
      return { error: null };
    } catch (err) {
      const error = err instanceof Error ? err : new Error('An unknown error occurred');
      showToast.error('Failed to log out');
      return { error };
    } finally {
      setIsLoading(false);
    }
  };

  return { logout, isLoading };
};
