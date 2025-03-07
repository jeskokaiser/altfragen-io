
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useLogout = () => {
  const [isLoading, setIsLoading] = useState(false);

  const logout = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      return { error };
    } finally {
      setIsLoading(false);
    }
  };

  return { logout, isLoading };
};
