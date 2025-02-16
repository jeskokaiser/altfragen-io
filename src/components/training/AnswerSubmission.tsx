
import React from 'react';
import { Question } from '@/types/Question';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { User } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { XCircle, Eye } from 'lucide-react';

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
  const [showSolution, setShowSolution] = React.useState(false);

  // Reset state when question changes
  React.useEffect(() => {
    setHasSubmittedWrong(false);
    setLastSubmissionCorrect(null);
    setWrongAnswers([]);
    setShowSolution(false);
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

  const handleShowSolution = async () => {
    if (!user) return;
    
    try {
      // Insert record with wrong answer to track that solution was viewed
      const { error: insertError } = await supabase
        .from('user_progress')
        .insert({
          user_id: user.id,
          question_id: currentQuestion.id,
          user_answer: 'solution_viewed',
          is_correct: false
        });

      if (insertError) {
        toast.error("Fehler beim Speichern des Fortschritts");
        throw insertError;
      }

      // Set wrongAnswers to 4 to trigger the same behavior as 4 wrong attempts
      setWrongAnswers(['A', 'B', 'C', 'D']);
      setShowSolution(true);
      onAnswerSubmitted('solution_viewed', false);
    } catch (error: any) {
      console.error('Error saving progress:', error);
      toast.error("Fehler beim Speichern des Fortschritts");
    }
  };

  // Hide the submission interface if all wrong answers have been tried
  if (wrongAnswers.length >= 4) return null;

  return (
    <div className="mt-4 space-y-4">
      <div className="flex flex-col gap-4">
        <Button 
          onClick={handleConfirmAnswer}
          disabled={!selectedAnswer}
          className="w-full"
        >
          Antwort bestätigen
        </Button>
        
        <button
          onClick={handleShowSolution}
          className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 flex items-center justify-center gap-1 transition-colors"
        >
          <Eye className="h-4 w-4" />
          <span>Lösung anzeigen</span>
        </button>
      </div>
      
      {lastSubmissionCorrect !== null && !lastSubmissionCorrect && (
        <Alert variant="destructive">
          <div className="flex items-center gap-2">
            <XCircle className="text-red-500" />
            <span className="dark:text-white">Falsche Antwort! Versuche es noch einmal.</span>
          </div>
        </Alert>
      )}

      {showSolution && (
        <Alert>
          <div className="flex items-center gap-2">
            <span>Lösung: {currentQuestion.correctAnswer}</span>
          </div>
        </Alert>
      )}
    </div>
  );
};

export default AnswerSubmission;
