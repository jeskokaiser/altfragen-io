import { useQuery } from '@tanstack/react-query';
import { fetchUserQuestions } from '@/services/DatabaseService';
import { Question } from '@/types/Question';
import { useAuth } from '@/contexts/AuthContext';

export const useQuestions = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['questions', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const data = await fetchUserQuestions(user.id);
      
      return data.map(q => ({
        id: q.id,
        question: q.question,
        optionA: q.option_a,
        optionB: q.option_b,
        optionC: q.option_c,
        optionD: q.option_d,
        optionE: q.option_e,
        subject: q.subject,
        correctAnswer: q.correct_answer,
        comment: q.comment,
        filename: q.filename,
        created_at: q.created_at
      })) as Question[];
    },
    enabled: !!user
  });
};