import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useSubjects = () => {
  const [subjects, setSubjects] = useState<string[]>([]);

  useEffect(() => {
    const fetchSubjects = async () => {
      const { data } = await supabase
        .from('questions')
        .select('subject')
        .order('subject');
      
      if (data) {
        const uniqueSubjects = Array.from(new Set(data.map(q => q.subject)))
          .sort((a, b) => a.localeCompare(b, 'de'));
        setSubjects(uniqueSubjects);
      }
    };

    fetchSubjects();
  }, []);

  return subjects;
};