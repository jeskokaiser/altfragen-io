
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
  // Show feedback if there's a user answer and showFeedback is true
  if (!showFeedback || !userAnswer) return null;

  // After 4 wrong attempts, show the feedback regardless of correctness
  return (
    <FeedbackDisplay 
      isCorrect={isCorrect}
      correctAnswer={correctAnswer}
      comment={comment}
    />
  );
};

export default QuestionFeedback;
