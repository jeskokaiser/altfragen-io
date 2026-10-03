import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { listQuestionSubjects } from '@/services/QuestionSearchService';

/** The subjects the user's visible questions use, for the subject picker. */
export const useSubjects = () => {
  const { user } = useAuth();

  // Keyed on the user: RLS decides which subjects appear.
  const { data } = useQuery({
    queryKey: ['question-subjects', user?.id],
    queryFn: listQuestionSubjects,
    enabled: !!user?.id,
  });

  return data ?? [];
};
