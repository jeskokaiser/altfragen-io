
import React from 'react';
import QuestionHeader from '@/components/features/questions/header/QuestionHeader';

interface QuestionViewHeaderProps {
  currentIndex: number;
  totalQuestions: number;
  onQuit: () => void;
}

const QuestionViewHeader: React.FC<QuestionViewHeaderProps> = ({
  currentIndex,
  totalQuestions,
  onQuit
}) => {
  return (
    <QuestionHeader
      currentIndex={currentIndex}
      totalQuestions={totalQuestions}
      onQuit={onQuit}
    />
  );
};

export default QuestionViewHeader;
