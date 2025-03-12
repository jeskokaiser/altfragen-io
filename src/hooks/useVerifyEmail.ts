
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export const useVerifyEmail = () => {
  const { user } = useAuth();
  
  useEffect(() => {
    const checkEmailVerification = async () => {
      if (!user) return;
      
      try {
        // Check if user was just confirmed
        const currentUrl = window.location.href;
        if (currentUrl.includes('access_token') && !currentUrl.includes('type=recovery')) {
          // Call the verification edge function
          const response = await supabase.functions.invoke('handle-verification', {
            body: { userId: user.id },
          });
          
          if (response.error) {
            console.error('Error during verification:', response.error);
            toast.error('Es gab ein Problem bei der Verifizierung Ihrer Universität.');
            return;
          }
          
          if (response.data?.success) {
            toast.success(`E-Mail verifiziert! Sie wurden mit ${response.data.university} verknüpft.`);
          }
        }
      } catch (error) {
        console.error('Error checking email verification:', error);
      }
    };
    
    checkEmailVerification();
  }, [user]);
};
