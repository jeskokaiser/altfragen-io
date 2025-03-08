
import { useState, useCallback, useEffect } from 'react';
import { Question } from '@/types/models/Question';
import { AnswerState } from '@/types/models/Answer';
import { useMarkQuestionUnclear } from '@/hooks/use-mark-question-unclear';
import { toast } from 'sonner';

interface UseQuestionViewProps {
  questionData: Question;
  userAnswer: AnswerState;
  onAnswer: (answer: string, isFirstAttempt: boolean, viewedSolution: boolean) => void;
  onQuestionUpdate?: (updatedQuestion: Question) => void;
}

export const useQuestionView = ({
  questionData,
  userAnswer,
  onAnswer,
  onQuestionUpdate
}: UseQuestionViewProps) => {
  const [showFeedback, setShowFeedback] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<Question>(questionData);
  const [isCorrect, setIsCorrect] = useState(false);
  const [wrongAnswers, setWrongAnswers] = useState<string[]>([]);
  const [showSolution, setShowSolution] = useState(false);
  const { markQuestionUnclear, isLoading: isMarkingUnclear } = useMarkQuestionUnclear();

  // Reset state when question changes
  useEffect(() => {
    console.log("Question changed in useQuestionView, resetting state. User answer:", userAnswer?.value);
    // Set the selected answer based on the user's previous answer
    setSelectedAnswer(userAnswer?.value || '');
    setShowFeedback(Boolean(userAnswer?.value));
    setCurrentQuestion(questionData);
    setIsCorrect(userAnswer?.value === questionData.correctAnswer);
    setWrongAnswers(userAnswer?.attempts?.filter(a => a !== questionData.correctAnswer) || []);
    setShowSolution(Boolean(userAnswer?.viewedSolution));
  }, [questionData.id, userAnswer]); // Only dependencies that should trigger a reset

  const handleAnswerChange = useCallback((answer: string) => {
    console.log("Answer changed in useQuestionView:", answer);
    setSelectedAnswer(answer);
  }, []);

  const handleAnswerSubmitted = useCallback((answer: string, correct: boolean, showSol?: boolean) => {
    console.log("Answer submitted in QuestionView:", answer, "Correct:", correct);
    onAnswer(answer, wrongAnswers.length === 0, showSol || false);
    setShowFeedback(true);
    setIsCorrect(correct);
    
    if (showSol !== undefined) {
      setShowSolution(showSol);
    }
    
    if (!correct && answer !== 'solution_viewed') {
      setWrongAnswers(prev => [...prev, answer]);
    }
  }, [wrongAnswers.length, onAnswer]);

  const handleQuestionUpdate = useCallback((updatedQuestion: Question) => {
    setCurrentQuestion(updatedQuestion);
    setIsEditModalOpen(false);
    if (onQuestionUpdate) {
      onQuestionUpdate(updatedQuestion);
    }
  }, [onQuestionUpdate]);

  const handleMarkUnclear = useCallback(async () => {
    try {
      await markQuestionUnclear(currentQuestion.id);
      toast.info('Frage als unklar markiert');
      setCurrentQuestion({
        ...currentQuestion,
        is_unclear: true,
        marked_unclear_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error marking question as unclear:', error);
      toast.error('Fehler beim Markieren der Frage');
    }
  }, [currentQuestion, markQuestionUnclear]);

  return {
    showFeedback,
    selectedAnswer,
    isEditModalOpen,
    setIsEditModalOpen,
    currentQuestion,
    isCorrect,
    wrongAnswers,
    showSolution,
    handleAnswerChange,
    handleAnswerSubmitted,
    handleQuestionUpdate,
    handleMarkUnclear
  };
};
