
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { showToast } from '@/utils/toast';

export const useSubjects = () => {
  const [subjects, setSubjects] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchSubjects = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const { data, error } = await supabase
          .from('questions')
          .select('subject')
          .order('subject');
        
        if (error) {
          throw error;
        }
        
        if (data) {
          const uniqueSubjects = Array.from(new Set(data.map(q => q.subject)))
            .sort((a, b) => a.localeCompare(b, 'de'));
          setSubjects(uniqueSubjects);
        }
      } catch (e) {
        const err = e instanceof Error ? e : new Error('Failed to fetch subjects');
        setError(err);
        console.error('Error fetching subjects:', err);
        showToast.error('Failed to fetch subjects');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubjects();
  }, []);

  return { subjects, isLoading, error };
};
