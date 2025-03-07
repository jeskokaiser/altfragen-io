
import { useState } from 'react';
import { Question } from '@/types/Question';
import { supabase } from '@/integrations/supabase/client';

export const useUpdateQuestion = () => {
  const [isLoading, setIsLoading] = useState(false);

  const updateQuestion = async (question: Question): Promise<Question> => {
    setIsLoading(true);
    try {
      const { data: updatedQuestion, error } = await supabase
        .from('questions')
        .update({
          question: question.question,
          option_a: question.optionA,
          option_b: question.optionB,
          option_c: question.optionC,
          option_d: question.optionD,
          option_e: question.optionE,
          correct_answer: question.correctAnswer,
          comment: question.comment,
          subject: question.subject,
          difficulty: question.difficulty
        })
        .eq('id', question.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return {
        id: updatedQuestion.id,
        question: updatedQuestion.question,
        optionA: updatedQuestion.option_a,
        optionB: updatedQuestion.option_b,
        optionC: updatedQuestion.option_c,
        optionD: updatedQuestion.option_d,
        optionE: updatedQuestion.option_e,
        correctAnswer: updatedQuestion.correct_answer,
        comment: updatedQuestion.comment,
        subject: updatedQuestion.subject,
        filename: updatedQuestion.filename,
        difficulty: updatedQuestion.difficulty,
        is_unclear: updatedQuestion.is_unclear,
        marked_unclear_at: updatedQuestion.marked_unclear_at
      };
    } finally {
      setIsLoading(false);
    }
  };

  return { updateQuestion, isLoading };
};
