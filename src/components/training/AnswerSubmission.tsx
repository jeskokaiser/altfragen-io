import React from 'react';
import { Question } from '@/types/Question';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { XCircle, Eye } from 'lucide-react';
import FeedbackDisplay from './FeedbackDisplay';
import { useUserPreferences } from '@/contexts/UserPreferencesContext';
import { showToast } from '@/utils/toast';
import { useAuth } from '@/contexts/AuthContext';
import { getKeyDisplayName } from '@/hooks/useTrainingKeyboard';
import { useIsMobile } from '@/hooks/use-mobile';

interface AnswerSubmissionProps {
  currentQuestion: Question;
  selectedAnswer: string;
  user: User | null;
  onAnswerSubmitted: (answer: string, isCorrect: boolean, viewedSolution?: boolean) => void;
  showSolution: boolean;
  wrongAnswers: string[];
  showFeedback: boolean;
  isCorrect: boolean;
}

const AnswerSubmission = ({
  currentQuestion,
  selectedAnswer,
  user,
  onAnswerSubmitted,
  showSolution,
  wrongAnswers,
  showFeedback,
  isCorrect,
}: AnswerSubmissionProps) => {
  const [hasSubmittedWrong, setHasSubmittedWrong] = React.useState(false);
  const [lastSubmissionCorrect, setLastSubmissionCorrect] = React.useState<boolean | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const { preferences } = useUserPreferences();
  const isMobile = useIsMobile();

  React.useEffect(() => {
    setHasSubmittedWrong(false);
    setLastSubmissionCorrect(null);
  }, [currentQuestion]);

  const handleConfirmAnswer = async () => {
    if (!selectedAnswer || !user || isSubmitting) return;

    setIsSubmitting(true);
    // Compare only the first letter, case insensitive
    const isCorrect = selectedAnswer.charAt(0).toLowerCase() === currentQuestion.correctAnswer.charAt(0).toLowerCase();

    try {
      const { data: existingProgress, error: fetchError } = await supabase
        .from('user_progress')
        .select('is_correct, attempts_count')
        .eq('user_id', user.id)
        .eq('question_id', currentQuestion.id)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (!existingProgress) {
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
        const { error: updateError } = await supabase
          .from('user_progress')
          .update({
            user_answer: selectedAnswer,
            attempts_count: (existingProgress.attempts_count || 1) + 1,
            is_correct: isCorrect ? (preferences?.immediateFeedback || wrongAnswers.length === 0) : existingProgress.is_correct
          })
          .eq('user_id', user.id)
          .eq('question_id', currentQuestion.id);

        if (updateError) throw updateError;

        if (existingProgress.is_correct) {
          if (isCorrect) {
            showToast.info("Diese Frage hattest du schon einmal richtig!");
          } else {
            showToast.warning("Schade, zuvor hattest du diese Frage richtig.");
          }
        } else {
          if (isCorrect) {
            if (preferences?.immediateFeedback || wrongAnswers.length === 0) {
              showToast.success("Super! Die Frage ist jetzt als richtig markiert.");
            } else {
              showToast.info("Richtig! Die Frage bleibt aber als falsch markiert, da es nicht der erste Versuch war.");
            }
          } else {
            showToast.info("Weiter üben! Du schaffst das!");
          }
        }
      }

      if (!isCorrect && !preferences?.immediateFeedback) {
        setHasSubmittedWrong(true);
      }

      setLastSubmissionCorrect(isCorrect);
      
      // Pass true for viewedSolution when immediate feedback is enabled (for both correct and incorrect)
      const shouldShowSolution = preferences?.immediateFeedback;
      onAnswerSubmitted(selectedAnswer, isCorrect, shouldShowSolution);

    } catch (error) {
      console.error('Error handling answer submission:', error);
      showToast.error("Fehler beim Speichern des Fortschritts");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleShowSolution = () => {
    if (!user) return;
    setLastSubmissionCorrect(false);
    onAnswerSubmitted('solution_viewed', false, true);
  };

  if (preferences?.immediateFeedback) {
    return (
      <div className="mt-4 space-y-4">
        {!showSolution && (
          <Button 
            onClick={handleConfirmAnswer}
            disabled={!selectedAnswer || isSubmitting}
            className="w-full flex items-center justify-center gap-2"
          >
            <span>{isSubmitting ? "Wird gespeichert..." : "Antwort bestätigen"}</span>
            {!isSubmitting && selectedAnswer && !isMobile && (
              <span className="text-xs bg-white/20 px-1 py-0.5 rounded">
                {getKeyDisplayName(preferences.keyboardBindings.confirmAnswer)}
              </span>
            )}
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

  return (
    <div className="mt-4 space-y-4">
      <Button 
        onClick={handleConfirmAnswer}
        disabled={!selectedAnswer || isSubmitting}
        className="w-full flex items-center justify-center gap-2"
      >
        <span>{isSubmitting ? "Wird gespeichert..." : "Antwort bestätigen"}</span>
        {!isSubmitting && selectedAnswer && !isMobile && (
          <span className="text-xs bg-white/20 px-1 py-0.5 rounded">
            {getKeyDisplayName(preferences.keyboardBindings.confirmAnswer)}
          </span>
        )}
      </Button>
      
      {showFeedback && !preferences?.immediateFeedback && !isCorrect && wrongAnswers.length < 4 && !showSolution && (
        <div className="space-y-4">
          <Alert variant="destructive">
            <div className="flex items-center gap-2">
              <XCircle className="text-red-500" />
              <span className="dark:text-white">Falsche Antwort! Versuche es noch einmal.</span>
            </div>
          </Alert>
          
          <Button
            variant="outline"
            onClick={handleShowSolution}
            className="w-full flex items-center justify-center gap-2"
          >
            <Eye className="h-4 w-4" />
            <span>Lösung anzeigen</span>
            {!isMobile && (
              <span className="text-xs bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded">
                {getKeyDisplayName(preferences.keyboardBindings.showSolution)}
              </span>
            )}
          </Button>
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
