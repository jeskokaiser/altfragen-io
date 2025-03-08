
import React from 'react';
import NavigationButtons from '@/components/features/questions/navigation/NavigationButtons';

interface QuestionNavigationProps {
  onPrevious: () => void;
  onNext: () => void;
  isFirstQuestion: boolean;
  isLastQuestion: boolean;
  hasUserAnswer: boolean;
  wrongAttempts: number;
  showSolution: boolean;
}

const QuestionNavigation: React.FC<QuestionNavigationProps> = ({
  onPrevious,
  onNext,
  isFirstQuestion,
  isLastQuestion,
  hasUserAnswer,
  wrongAttempts,
  showSolution
}) => {
  return (
    <NavigationButtons
      onPrevious={onPrevious}
      onNext={onNext}
      isFirstQuestion={isFirstQuestion}
      isLastQuestion={isLastQuestion}
      hasUserAnswer={hasUserAnswer}
      wrongAttempts={wrongAttempts}
      showSolution={showSolution}
    />
  );
};

export default QuestionNavigation;
