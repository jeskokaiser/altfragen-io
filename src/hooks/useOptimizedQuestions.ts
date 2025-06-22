
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface QuestionSummary {
  id: string;
  filename: string;
  subject: string;
  difficulty: number;
  visibility: 'private' | 'university' | 'public';
  user_id: string | null;
  university_id: string | null;
  semester: string | null;
  year: string | null;
  exam_name: string | null;
  created_at: string;
}

export const useOptimizedQuestions = (userId: string | undefined, universityId?: string | null) => {
  const personalQuestionsQuery = useQuery({
    queryKey: ['personal-questions-summary', userId],
    queryFn: async (): Promise<QuestionSummary[]> => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from('questions')
        .select(`
          id,
          filename,
          subject,
          difficulty,
          visibility,
          user_id,
          university_id,
          exam_semester,
          exam_year,
          exam_name,
          created_at
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(q => ({
        id: q.id,
        filename: q.filename,
        subject: q.subject,
        difficulty: q.difficulty,
        visibility: (q.visibility as 'private' | 'university' | 'public') || 'private',
        user_id: q.user_id,
        university_id: q.university_id,
        semester: q.exam_semester,
        year: q.exam_year,
        exam_name: q.exam_name,
        created_at: q.created_at
      }));
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes cache
    refetchOnWindowFocus: false
  });

  const universityQuestionsQuery = useQuery({
    queryKey: ['university-questions-summary', universityId],
    queryFn: async (): Promise<QuestionSummary[]> => {
      if (!universityId) return [];
      
      const { data, error } = await supabase
        .from('questions')
        .select(`
          id,
          filename,
          subject,
          difficulty,
          visibility,
          user_id,
          university_id,
          exam_semester,
          exam_year,
          exam_name,
          created_at
        `)
        .eq('university_id', universityId)
        .eq('visibility', 'university')
        .neq('user_id', userId) // Exclude own questions to avoid duplicates
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(q => ({
        id: q.id,
        filename: q.filename,
        subject: q.subject,
        difficulty: q.difficulty,
        visibility: (q.visibility as 'private' | 'university' | 'public') || 'private',
        user_id: q.user_id,
        university_id: q.university_id,
        semester: q.exam_semester,
        year: q.exam_year,
        exam_name: q.exam_name,
        created_at: q.created_at
      }));
    },
    enabled: !!universityId,
    staleTime: 5 * 60 * 1000, // 5 minutes cache (university data changes less frequently)
    refetchOnWindowFocus: false
  });

  return {
    personalQuestions: personalQuestionsQuery.data || [],
    universityQuestions: universityQuestionsQuery.data || [],
    isPersonalLoading: personalQuestionsQuery.isLoading,
    isUniversityLoading: universityQuestionsQuery.isLoading,
    personalError: personalQuestionsQuery.error,
    universityError: universityQuestionsQuery.error,
    isLoading: personalQuestionsQuery.isLoading || (universityId && universityQuestionsQuery.isLoading)
  };
};
