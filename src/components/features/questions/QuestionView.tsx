
import React, { useMemo } from 'react';
import { Question } from '@/types/models/Question';
import { AnswerState } from '@/types/models/Answer';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { useQuestionView } from '@/hooks/use-question-view';
import QuestionViewHeader from './header/QuestionViewHeader';
import QuestionContentWrapper from './container/QuestionContentWrapper';
import QuestionNavigation from './navigation/QuestionNavigation';
import EditQuestionModalWrapper from './modal/EditQuestionModalWrapper';

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
  const { user } = useAuth();
  const isMobile = useIsMobile();
  
  const {
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
  } = useQuestionView({
    questionData,
    userAnswer,
    onAnswer,
    onQuestionUpdate
  });

  if (!currentQuestion) {
    return <div>Loading question...</div>;
  }

  return (
    <div className={`w-full max-w-2xl mx-auto ${isMobile ? 'px-2' : ''}`}>
      <QuestionViewHeader 
        currentIndex={currentIndex}
        totalQuestions={totalQuestions}
        onQuit={onQuit}
      />

      <QuestionContentWrapper
        question={currentQuestion}
        showFeedback={showFeedback}
        selectedAnswer={selectedAnswer}
        onAnswerChange={handleAnswerChange}
        userAnswer={userAnswer?.value || ''}
        isCorrect={isCorrect}
        wrongAnswers={wrongAnswers}
        user={user}
        onAnswerSubmitted={handleAnswerSubmitted}
        onEditClick={() => setIsEditModalOpen(true)}
        onMarkUnclear={handleMarkUnclear}
      />

      <QuestionNavigation
        onPrevious={onPrevious}
        onNext={onNext}
        isFirstQuestion={currentIndex === 0}
        isLastQuestion={currentIndex === totalQuestions - 1}
        hasUserAnswer={!!userAnswer && isCorrect}
        wrongAttempts={wrongAnswers.length}
        showSolution={showSolution}
      />

      <EditQuestionModalWrapper
        question={currentQuestion}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onQuestionUpdated={handleQuestionUpdate}
      />
    </div>
  );
};

export default React.memo(QuestionView);
