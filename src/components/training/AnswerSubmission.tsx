
import React from 'react';
import { Question } from '@/types/Question';
import { toast } from 'sonner';
import { User } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { saveQuestionProgress, updateQuestionProgress } from '@/services/DatabaseService';

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

      // Save or update the progress
      try {
        await updateQuestionProgress(user.id, currentQuestion.id, selectedAnswer, isCorrect);
      } catch {
        await saveQuestionProgress(user.id, currentQuestion.id, selectedAnswer, isCorrect);
      }

      if (isCorrect) {
        toast.success('Richtige Antwort! Der Fortschritt wurde aktualisiert.');
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
