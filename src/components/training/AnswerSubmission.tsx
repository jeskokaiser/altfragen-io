
import React from 'react';
import { Question } from '@/types/Question';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { User } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';

interface AnswerSubmissionProps {
  currentQuestion: Question;
  selectedAnswer: string;
  user: User | null;
  onAnswerSubmitted: (answer: string) => void;
}

const AnswerSubmission = ({
  currentQuestion,
  selectedAnswer,
  user,
  onAnswerSubmitted,
}: AnswerSubmissionProps) => {
  const handleConfirmAnswer = async () => {
    if (!selectedAnswer || !user) return;

    onAnswerSubmitted(selectedAnswer);

    try {
      // Compare only the first letter, ignoring case
      const isCorrect = selectedAnswer.charAt(0).toLowerCase() === currentQuestion.correctAnswer.charAt(0).toLowerCase();

      // First, get all progress records for this question
      const { data: existingProgress, error: fetchError } = await supabase
        .from('user_progress')
        .select()
        .eq('user_id', user.id)
        .eq('question_id', currentQuestion.id);

      if (fetchError) throw fetchError;

      if (existingProgress && existingProgress.length > 0) {
        // Update all progress records for this question
        const { error: updateError } = await supabase
          .from('user_progress')
          .update({
            user_answer: selectedAnswer,
            is_correct: isCorrect
          })
          .eq('user_id', user.id)
          .eq('question_id', currentQuestion.id);

        if (updateError) throw updateError;

        if (isCorrect) {
          toast.success('Richtige Antwort! Der Fortschritt wurde aktualisiert.');
        }
      } else {
        // Insert new progress record
        const { error: insertError } = await supabase
          .from('user_progress')
          .insert({
            user_id: user.id,
            question_id: currentQuestion.id,
            user_answer: selectedAnswer,
            is_correct: isCorrect
          });

        if (insertError) throw insertError;
      }
    } catch (error: any) {
      console.error('Error saving progress:', error);
      toast.error("Fehler beim Speichern des Fortschritts");
    }
  };

  return (
    <div className="mt-4">
      <Button 
        onClick={handleConfirmAnswer}
        disabled={!selectedAnswer}
        className="w-full"
      >
        Antwort bestätigen
      </Button>
    </div>
  );
};

export default AnswerSubmission;
