
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export const useAdminRole = () => {
  const { user, loading: authLoading } = useAuth();

  const { data: hasAdminRole, isLoading } = useQuery({
    queryKey: ['admin-role', user?.id],
    queryFn: async () => {
      if (!user) return false;
      
      const { data, error } = await supabase.rpc('has_role', {
        _user_id: user.id,
        _role: 'admin'
      });
      
      if (error) {
        console.error('Error checking admin role:', error);
        return false;
      }
      
      return data || false;
    },
    enabled: !!user && !authLoading,
  });

  return {
    hasAdminRole: hasAdminRole || false,
    isLoading: isLoading || authLoading
  };
};
