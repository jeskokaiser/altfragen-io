
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
  const [wrongAnswers, setWrongAnswers] = React.useState<string[]>([]);

  // Reset state when question changes
  React.useEffect(() => {
    setHasSubmittedWrong(false);
    setLastSubmissionCorrect(null);
    setWrongAnswers([]);
  }, [currentQuestion]);

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

      // If this attempt is wrong, add it to wrongAnswers
      if (!isCorrect) {
        setHasSubmittedWrong(true);
        if (!wrongAnswers.includes(selectedAnswer)) {
          setWrongAnswers(prev => [...prev, selectedAnswer]);
        }
      }

      setLastSubmissionCorrect(isCorrect);
      onAnswerSubmitted(selectedAnswer, isCorrect);
    } catch (error: any) {
      console.error('Error saving progress:', error);
      toast.error("Fehler beim Speichern des Fortschritts");
    }
  };

  // Hide the submission interface if all wrong answers have been tried
  if (wrongAnswers.length >= 4) return null;

  return (
    <div className="mt-6 space-y-4">
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
            <XCircle className="text-red-500" />
            <span className="dark:text-white">Falsche Antwort! Versuche es noch einmal.</span>
          </div>
        </Alert>
      )}
    </div>
  );
};

export default AnswerSubmission;
