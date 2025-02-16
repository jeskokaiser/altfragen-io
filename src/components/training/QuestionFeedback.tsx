
import React from 'react';
import FeedbackDisplay from './FeedbackDisplay';

interface QuestionFeedbackProps {
  showFeedback: boolean;
  userAnswer: string | undefined;
  correctAnswer: string;
  comment?: string;
  isCorrect: boolean;
}

const QuestionFeedback: React.FC<QuestionFeedbackProps> = ({
  showFeedback,
  userAnswer,
  correctAnswer,
  comment,
  isCorrect,
}) => {
  if (!showFeedback || !userAnswer) return null;

  return (
    <FeedbackDisplay 
      isCorrect={isCorrect}
      correctAnswer={correctAnswer}
      comment={comment}
    />
  );
};

export default QuestionFeedback;
