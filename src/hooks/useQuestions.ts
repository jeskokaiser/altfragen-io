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
        optionA: q.optionA,
        optionB: q.optionB,
        optionC: q.optionC,
        optionD: q.optionD,
        optionE: q.optionE,
        subject: q.subject,
        correctAnswer: q.correctAnswer,
        comment: q.comment,
        filename: q.filename,
        created_at: q.created_at
      })) as Question[];
    },
    enabled: !!user
  });
};