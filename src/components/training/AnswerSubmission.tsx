
import React from 'react';
import { Question } from '@/types/Question';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { User } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { XCircle } from 'lucide-react';

interface AnswerSubmissionProps {
  currentQuestion: Question;
  selectedAnswer: string;
  user: User | null;
  onAnswerSubmitted: (answer: string, isCorrect: boolean) => void;
}

const AnswerSubmission = ({
  currentQuestion,
  selectedAnswer,
  user,
  onAnswerSubmitted,
}: AnswerSubmissionProps) => {
  const [hasSubmittedWrong, setHasSubmittedWrong] = React.useState(false);
  const [lastSubmissionCorrect, setLastSubmissionCorrect] = React.useState<boolean | null>(null);

  const handleConfirmAnswer = async () => {
    if (!selectedAnswer || !user) return;

    // Compare only the first letter, ignoring case
    const isCorrect = selectedAnswer.charAt(0).toLowerCase() === currentQuestion.correctAnswer.charAt(0).toLowerCase();

    try {
      // First, get all progress records for this question
      const { data: existingProgress, error: fetchError } = await supabase
        .from('user_progress')
        .select()
        .eq('user_id', user.id)
        .eq('question_id', currentQuestion.id);

      if (fetchError) throw fetchError;

      // If there's no existing progress, save this attempt
      if (!existingProgress?.length) {
        // Insert new progress record
        const { error: insertError } = await supabase
          .from('user_progress')
          .insert({
            user_id: user.id,
            question_id: currentQuestion.id,
            user_answer: selectedAnswer,
            is_correct: isCorrect
          });

        if (insertError) {
          toast.error("Fehler beim Speichern des Fortschritts");
          throw insertError;
        }
      }

      // If this attempt is wrong, mark it as having submitted wrong
      if (!isCorrect) {
        setHasSubmittedWrong(true);
      }

      setLastSubmissionCorrect(isCorrect);
      onAnswerSubmitted(selectedAnswer, isCorrect);
    } catch (error: any) {
      console.error('Error saving progress:', error);
      toast.error("Fehler beim Speichern des Fortschritts");
    }
  };

  return (
    <div className="mt-4 space-y-4">
      <Button 
        onClick={handleConfirmAnswer}
        disabled={!selectedAnswer}
        className="w-full"
      >
        Antwort bestätigen
      </Button>
      
      {lastSubmissionCorrect !== null && !lastSubmissionCorrect && (
        <Alert variant="destructive">
          <div className="flex items-center gap-2">
            <XCircle className="h-4 w-4 text-red-500" />
            <span>Falsche Antwort! Versuche es noch einmal.</span>
          </div>
        </Alert>
      )}
    </div>
  );
};

export default AnswerSubmission;
