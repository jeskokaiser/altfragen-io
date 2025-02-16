
import React from 'react';
import { Question } from '@/types/Question';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { User } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { XCircle, Eye } from 'lucide-react';
import FeedbackDisplay from './FeedbackDisplay';

interface AnswerSubmissionProps {
  currentQuestion: Question;
  selectedAnswer: string;
  user: User | null;
  onAnswerSubmitted: (answer: string, isCorrect: boolean, showSolution?: boolean) => void;
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
  const [showSolution, setShowSolution] = React.useState(false);
  const [hasRecordedAttempt, setHasRecordedAttempt] = React.useState(false);

  React.useEffect(() => {
    setHasSubmittedWrong(false);
    setLastSubmissionCorrect(null);
    setWrongAnswers([]);
    setShowSolution(false);
    setHasRecordedAttempt(false);
  }, [currentQuestion]);

  const handleConfirmAnswer = async () => {
    if (!selectedAnswer || !user) return;

    const isCorrect = selectedAnswer.charAt(0).toLowerCase() === currentQuestion.correctAnswer.charAt(0).toLowerCase();

    // Only save to database if this is the first attempt for this question
    if (!hasRecordedAttempt) {
      try {
        const { error: insertError } = await supabase
          .from('user_progress')
          .insert({
            user_id: user.id,
            question_id: currentQuestion.id,
            user_answer: selectedAnswer,
            is_correct: isCorrect,
            attempt_number: 1
          });

        if (insertError) {
          console.error('Error saving progress:', insertError);
          toast.error("Fehler beim Speichern des Fortschritts");
        } else {
          setHasRecordedAttempt(true);
        }
      } catch (error: any) {
        console.error('Error saving progress:', error);
        toast.error("Fehler beim Speichern des Fortschritts");
      }
    }

    // Handle the answer result locally
    if (!isCorrect) {
      setHasSubmittedWrong(true);
      if (!wrongAnswers.includes(selectedAnswer)) {
        setWrongAnswers(prev => [...prev, selectedAnswer]);
      }
    }

    setLastSubmissionCorrect(isCorrect);
    onAnswerSubmitted(selectedAnswer, isCorrect, showSolution);
  };

  const handleShowSolution = () => {
    if (!user) return;
    
    setShowSolution(true);
    onAnswerSubmitted('solution_viewed', false, true);
  };

  if (wrongAnswers.length >= 4) return null;

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
        <div className="space-y-4">
          <Alert variant="destructive">
            <div className="flex items-center gap-2">
              <XCircle className="text-red-500" />
              <span className="dark:text-white">Falsche Antwort! Versuche es noch einmal.</span>
            </div>
          </Alert>
          
          <button
            onClick={handleShowSolution}
            className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 flex items-center justify-center gap-1 transition-colors w-full"
          >
            <Eye className="h-4 w-4" />
            <span>Lösung anzeigen</span>
          </button>
        </div>
      )}

      {showSolution && (
        <FeedbackDisplay
          isCorrect={false}
          correctAnswer={currentQuestion.correctAnswer}
          comment={currentQuestion.comment}
        />
      )}
    </div>
  );
};

export default AnswerSubmission;
