
import React from 'react';
import { Question } from '@/types/Question';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { User } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { CheckCircle2, XCircle } from 'lucide-react';

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

    // Only save to database if this is the first attempt or if it's correct
    if (!hasSubmittedWrong || isCorrect) {
      try {
        // First, get all progress records for this question
        const { data: existingProgress, error: fetchError } = await supabase
          .from('user_progress')
          .select()
          .eq('user_id', user.id)
          .eq('question_id', currentQuestion.id);

        if (fetchError) throw fetchError;

        // If we've already submitted a wrong answer, don't update the database unless it's correct
        if (hasSubmittedWrong && !isCorrect) {
          onAnswerSubmitted(selectedAnswer, isCorrect);
          setLastSubmissionCorrect(isCorrect);
          return;
        }

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

          if (updateError) {
            toast.error("Fehler beim Speichern des Fortschritts");
            throw updateError;
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

          if (insertError) {
            toast.error("Fehler beim Speichern des Fortschritts");
            throw insertError;
          }
        }

        if (!isCorrect) {
          setHasSubmittedWrong(true);
        }

        setLastSubmissionCorrect(isCorrect);
      } catch (error: any) {
        console.error('Error saving progress:', error);
        toast.error("Fehler beim Speichern des Fortschritts");
      }
    }

    onAnswerSubmitted(selectedAnswer, isCorrect);
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
      
      {lastSubmissionCorrect !== null && (
        <Alert variant={lastSubmissionCorrect ? "default" : "destructive"}>
          <div className="flex items-center gap-2">
            {lastSubmissionCorrect ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span>Die Antwort ist korrekt.</span>
              </>
            ) : (
              <>
                <XCircle className="h-4 w-4 text-red-500" />
                <span>Falsche Antwort! Versuche es noch einmal.</span>
              </>
            )}
          </div>
        </Alert>
      )}
    </div>
  );
};

export default AnswerSubmission;
