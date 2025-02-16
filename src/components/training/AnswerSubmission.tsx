
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
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    setHasSubmittedWrong(false);
    setLastSubmissionCorrect(null);
    setWrongAnswers([]);
    setShowSolution(false);
  }, [currentQuestion]);

  const handleConfirmAnswer = async () => {
    if (!selectedAnswer || !user || isSubmitting) return;

    setIsSubmitting(true);
    const isCorrect = selectedAnswer.charAt(0).toLowerCase() === currentQuestion.correctAnswer.charAt(0).toLowerCase();

    try {
      // Check if there's an existing attempt
      const { data: existingProgress } = await supabase
        .from('user_progress')
        .select('is_correct, attempts_count')
        .eq('user_id', user.id)
        .eq('question_id', currentQuestion.id)
        .maybeSingle();

      if (!existingProgress) {
        // First attempt - record the result without toast
        const { error } = await supabase
          .from('user_progress')
          .insert({
            user_id: user.id,
            question_id: currentQuestion.id,
            user_answer: selectedAnswer,
            is_correct: isCorrect,
            attempts_count: 1
          });

        if (error) {
          console.error('Error saving progress:', error);
          toast.error("Fehler beim Speichern des Fortschritts");
          return;
        }
      } else {
        // This is a subsequent attempt
        const { error } = await supabase
          .from('user_progress')
          .update({
            user_answer: selectedAnswer,
            attempts_count: (existingProgress.attempts_count || 1) + 1,
            is_correct: isCorrect // Set is_correct to current attempt result
          })
          .eq('user_id', user.id)
          .eq('question_id', currentQuestion.id);

        if (error) {
          console.error('Error updating progress:', error);
          toast.error("Fehler beim Speichern des Fortschritts");
          return;
        }

        // Show appropriate toast messages for subsequent attempts
        if (isCorrect) {
          if (!existingProgress.is_correct) {
            // Was wrong before, now correct
            toast.success("Super! Die Frage ist jetzt als richtig markiert, aber die erste falsche Antwort bleibt für die Statistik erhalten.");
          } else {
            // Was already correct
            toast.success("Diese Frage hattest du bereits richtig beantwortet!");
          }
        } else {
          if (existingProgress.is_correct) {
            // Was correct before, now wrong
            toast.error("Diese Frage hattest du bereits richtig beantwortet. Versuch es noch einmal!");
          } else {
            // Was wrong before, still wrong
            toast.error("Weiter üben! Du schaffst das!");
          }
        }
      }

      if (!isCorrect) {
        setHasSubmittedWrong(true);
        if (!wrongAnswers.includes(selectedAnswer)) {
          setWrongAnswers(prev => [...prev, selectedAnswer]);
        }
      }

      setLastSubmissionCorrect(isCorrect);
      onAnswerSubmitted(selectedAnswer, isCorrect, showSolution);
    } catch (error: any) {
      console.error('Error saving progress:', error);
      toast.error("Fehler beim Speichern des Fortschritts");
    } finally {
      setIsSubmitting(false);
    }
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
        disabled={!selectedAnswer || isSubmitting}
        className="w-full"
      >
        {isSubmitting ? "Wird gespeichert..." : "Antwort bestätigen"}
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
