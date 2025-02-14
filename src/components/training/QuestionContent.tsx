
import React, { useState, useEffect } from 'react';
import { Question } from '@/types/Question';
import QuestionHeader from './QuestionHeader';
import QuestionOptions from './QuestionOptions';

interface QuestionContentProps {
  questionData: Question;
  selectedAnswer: string;
  onAnswerChange: (answer: string) => void;
  onConfirmAnswer: () => void;
  showFeedback: boolean;
}

const QuestionContent: React.FC<QuestionContentProps> = ({
  questionData,
  selectedAnswer,
  onAnswerChange,
  onConfirmAnswer,
  showFeedback,
}) => {
  const [resetTrigger, setResetTrigger] = useState(0);

  useEffect(() => {
    setResetTrigger(prev => prev + 1);
  }, [questionData]);

  if (!questionData) {
    return <div>Loading question...</div>;
  }

  return (
    <div className="space-y-4">
      <QuestionHeader questionData={questionData} />
      <QuestionOptions
        questionData={questionData}
        selectedAnswer={selectedAnswer}
        onAnswerChange={onAnswerChange}
        resetTrigger={resetTrigger}
      />
    </div>
  );
};

export default QuestionContent;
