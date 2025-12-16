import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export const useUniversityModerator = () => {
  const { user, universityId, loading: authLoading } = useAuth();
  const [isModerator, setIsModerator] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkModeratorRole = async () => {
      if (!user || !universityId || authLoading) {
        setIsModerator(false);
        setLoading(!authLoading);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('university_moderators')
          .select('id')
          .eq('university_id', universityId)
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Error checking moderator role:', error);
          setIsModerator(false);
        } else {
          setIsModerator(!!data);
        }
      } catch (error) {
        console.error('Error checking moderator role:', error);
        setIsModerator(false);
      } finally {
        setLoading(false);
      }
    };

    checkModeratorRole();
  }, [user, universityId, authLoading]);

  return { isModerator, loading };
};

