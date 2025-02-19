
import React from 'react';
import { Question } from '@/types/Question';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { User } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { XCircle, Eye } from 'lucide-react';
import FeedbackDisplay from './FeedbackDisplay';
import { useUserPreferences } from '@/contexts/UserPreferencesContext';

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
  const { preferences } = useUserPreferences();

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
      // First, get the existing progress
      const { data: existingProgress, error: fetchError } = await supabase
        .from('user_progress')
        .select('is_correct, attempts_count')
        .eq('user_id', user.id)
        .eq('question_id', currentQuestion.id)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (!existingProgress) {
        // For new questions, insert progress without showing a toast
        const { error: insertError } = await supabase
          .from('user_progress')
          .insert({
            user_id: user.id,
            question_id: currentQuestion.id,
            user_answer: selectedAnswer,
            is_correct: isCorrect,
            attempts_count: 1
          });

        if (insertError) throw insertError;
      } else {
        // For existing questions, update progress
        const { error: updateError } = await supabase
          .from('user_progress')
          .update({
            user_answer: selectedAnswer,
            attempts_count: (existingProgress.attempts_count || 1) + 1,
            is_correct: isCorrect ? (preferences.immediateFeedback || wrongAnswers.length === 0) : existingProgress.is_correct
          })
          .eq('user_id', user.id)
          .eq('question_id', currentQuestion.id);

        if (updateError) throw updateError;

        // Show toast messages for previously answered questions
        if (existingProgress.is_correct) {
          // Previously correct questions
          if (isCorrect) {
            toast.success("Diese Frage hattest du schon einmal richtig!");
          } else {
            toast.error("Schade, zuvor hattest du diese Frage richtig.");
          }
        } else {
          // Previously wrong questions
          if (isCorrect) {
            if (preferences.immediateFeedback || wrongAnswers.length === 0) {
              toast.success("Super! Die Frage ist jetzt als richtig markiert.");
            } else {
              toast.success("Richtig! Die Frage bleibt aber als falsch markiert, da es nicht der erste Versuch war.");
            }
          } else {
            toast.error("Weiter üben! Du schaffst das!");
          }
        }
      }

      // Update local state after successful database operation
      if (!isCorrect && !preferences.immediateFeedback) {
        setHasSubmittedWrong(true);
        if (!wrongAnswers.includes(selectedAnswer)) {
          setWrongAnswers(prev => [...prev, selectedAnswer]);
        }
      }

      setLastSubmissionCorrect(isCorrect);
      onAnswerSubmitted(selectedAnswer, isCorrect, preferences.immediateFeedback && !isCorrect);

      if (preferences.immediateFeedback) {
        setShowSolution(true);
      }

    } catch (error) {
      console.error('Error handling answer submission:', error);
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

  // In immediate feedback mode, only show submit button and feedback
  if (preferences.immediateFeedback) {
    return (
      <div className="mt-4 space-y-4">
        {!showSolution && (
          <Button 
            onClick={handleConfirmAnswer}
            disabled={!selectedAnswer || isSubmitting}
            className="w-full"
          >
            {isSubmitting ? "Wird gespeichert..." : "Antwort bestätigen"}
          </Button>
        )}
        
        {showSolution && (
          <FeedbackDisplay
            isCorrect={lastSubmissionCorrect || false}
            correctAnswer={currentQuestion.correctAnswer}
            comment={currentQuestion.comment}
          />
        )}
      </div>
    );
  }

  // Multiple attempts mode (up to 4 tries)
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
