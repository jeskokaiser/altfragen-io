
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Question } from '@/types/models/Question';
import { AnswerState } from '@/types/models/Answer';
import { useAuth } from '@/contexts/AuthContext';
import QuestionHeader from '@/components/features/questions/header/QuestionHeader';
import NavigationButtons from '@/components/features/questions/navigation/NavigationButtons';
import EditQuestionModal from '@/components/features/training/EditQuestionModal';
import QuestionContainer from './QuestionContainer';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';
import { useMarkQuestionUnclear } from '@/hooks/use-mark-question-unclear';

interface QuestionViewProps {
  questionData: Question;
  totalQuestions: number;
  currentIndex: number;
  onNext: () => void;
  onPrevious: () => void;
  onAnswer: (answer: string, isFirstAttempt: boolean, viewedSolution: boolean) => void;
  userAnswer: AnswerState;
  onQuit: () => void;
  onQuestionUpdate?: (updatedQuestion: Question) => void;
}

const QuestionView: React.FC<QuestionViewProps> = ({
  questionData,
  totalQuestions,
  currentIndex,
  onNext,
  onPrevious,
  onAnswer,
  userAnswer,
  onQuit,
  onQuestionUpdate,
}) => {
  const [showFeedback, setShowFeedback] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string>(userAnswer?.value || '');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<Question>(questionData);
  const [isCorrect, setIsCorrect] = useState(false);
  const [wrongAnswers, setWrongAnswers] = useState<string[]>([]);
  const [showSolution, setShowSolution] = useState(false);
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const { markQuestionUnclear, isLoading: isMarkingUnclear } = useMarkQuestionUnclear();

  // Reset state when question changes
  useEffect(() => {
    console.log("Question changed, resetting state. User answer:", userAnswer?.value);
    setSelectedAnswer(userAnswer?.value || '');
    setShowFeedback(false);
    setCurrentQuestion(questionData);
    setIsCorrect(false);
    setWrongAnswers([]);
    setShowSolution(false);
  }, [questionData, userAnswer]);

  // Memoize handlers to prevent unnecessary re-renders
  const handleAnswerChange = useCallback((answer: string) => {
    console.log("Answer changed in QuestionView:", answer);
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

  const handleNext = useCallback(() => {
    onNext();
  }, [onNext]);

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

  // Memoize QuestionHeader props
  const headerProps = useMemo(() => ({
    currentIndex,
    totalQuestions,
    onQuit
  }), [currentIndex, totalQuestions, onQuit]);

  // Memoize QuestionContainer props
  const containerProps = useMemo(() => ({
    question: currentQuestion,
    showFeedback,
    selectedAnswer,
    onAnswerChange: handleAnswerChange,
    userAnswer: userAnswer?.value || '',
    isCorrect,
    wrongAnswers,
    user,
    onAnswerSubmitted: handleAnswerSubmitted,
    onEditClick: () => setIsEditModalOpen(true),
    onMarkUnclear: handleMarkUnclear
  }), [
    currentQuestion, 
    showFeedback, 
    selectedAnswer, 
    handleAnswerChange, 
    userAnswer?.value, 
    isCorrect, 
    wrongAnswers, 
    user, 
    handleAnswerSubmitted, 
    handleMarkUnclear
  ]);

  // Memoize NavigationButtons props
  const navigationProps = useMemo(() => ({
    onPrevious,
    onNext: handleNext,
    isFirstQuestion: currentIndex === 0,
    isLastQuestion: currentIndex === totalQuestions - 1,
    hasUserAnswer: !!userAnswer && isCorrect,
    wrongAttempts: wrongAnswers.length,
    showSolution
  }), [
    onPrevious, 
    handleNext, 
    currentIndex, 
    totalQuestions, 
    userAnswer, 
    isCorrect, 
    wrongAnswers.length, 
    showSolution
  ]);

  if (!currentQuestion) {
    return <div>Loading question...</div>;
  }

  return (
    <div className={`w-full max-w-2xl mx-auto ${isMobile ? 'px-2' : ''}`}>
      <QuestionHeader {...headerProps} />

      <QuestionContainer {...containerProps} />

      <NavigationButtons {...navigationProps} />

      <EditQuestionModal
        question={currentQuestion}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onQuestionUpdated={handleQuestionUpdate}
      />
    </div>
  );
};

export default React.memo(QuestionView);
