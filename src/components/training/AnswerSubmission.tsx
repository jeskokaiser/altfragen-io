
import React from 'react';
import { Question } from '@/types/Question';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { User } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { XCircle, History } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface AnswerSubmissionProps {
  currentQuestion: Question;
  selectedAnswer: string;
  user: User | null;
  onAnswerSubmitted: (answer: string, isCorrect: boolean) => void;
}

interface QuestionHistory {
  attempts: number;
  lastCorrect: boolean;
  firstTry: boolean;
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
  const [questionHistory, setQuestionHistory] = React.useState<QuestionHistory | null>(null);

  // Reset state when question changes
  React.useEffect(() => {
    setHasSubmittedWrong(false);
    setLastSubmissionCorrect(null);
    setWrongAnswers([]);
    loadQuestionHistory();
  }, [currentQuestion]);

  const loadQuestionHistory = async () => {
    if (!user) return;

    try {
      const { data: progressData, error } = await supabase
        .from('user_progress')
        .select('is_correct, attempt_number')
        .eq('user_id', user.id)
        .eq('question_id', currentQuestion.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (progressData && progressData.length > 0) {
        const history: QuestionHistory = {
          attempts: progressData.length,
          lastCorrect: progressData[0].is_correct || false,
          firstTry: progressData.length === 1 && progressData[0].is_correct,
        };
        setQuestionHistory(history);
      } else {
        setQuestionHistory(null);
      }
    } catch (error) {
      console.error('Error loading question history:', error);
    }
  };

  const handleConfirmAnswer = async () => {
    if (!selectedAnswer || !user) return;

    // Compare only the first letter, ignoring case
    const isCorrect = selectedAnswer.charAt(0).toLowerCase() === currentQuestion.correctAnswer.charAt(0).toLowerCase();

    try {
      // Get the latest attempt number for this user and question
      const { data: latestAttempt, error: attemptError } = await supabase
        .from('user_progress')
        .select('attempt_number')
        .eq('user_id', user.id)
        .eq('question_id', currentQuestion.id)
        .order('attempt_number', { ascending: false })
        .limit(1);

      if (attemptError) throw attemptError;

      const nextAttemptNumber = latestAttempt && latestAttempt.length > 0 
        ? latestAttempt[0].attempt_number + 1 
        : 1;

      // Insert new progress record
      const { error: insertError } = await supabase
        .from('user_progress')
        .insert({
          user_id: user.id,
          question_id: currentQuestion.id,
          user_answer: selectedAnswer,
          is_correct: isCorrect,
          attempt_number: nextAttemptNumber
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
      await loadQuestionHistory(); // Reload history after new attempt
    } catch (error: any) {
      console.error('Error saving progress:', error);
      toast.error("Fehler beim Speichern des Fortschritts");
    }
  };

  // Hide the submission interface if all wrong answers have been tried
  if (wrongAnswers.length >= 4) return null;

  const getHistoryBadge = () => {
    if (!questionHistory) return null;

    if (questionHistory.firstTry) {
      return <Badge variant="default" className="bg-green-500">Erste Antwort richtig!</Badge>;
    } else if (questionHistory.attempts === 1) {
      return <Badge variant="secondary">Erster Versuch</Badge>;
    } else {
      return (
        <Badge 
          variant={questionHistory.lastCorrect ? "default" : "destructive"}
          className={questionHistory.lastCorrect ? "bg-blue-500" : ""}
        >
          {questionHistory.attempts}. Versuch
        </Badge>
      );
    }
  };

  return (
    <div className="mt-4 space-y-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {getHistoryBadge()}
        </div>
      </div>
      
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
