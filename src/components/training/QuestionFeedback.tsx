
import React from 'react';
import FeedbackDisplay from './FeedbackDisplay';

interface QuestionFeedbackProps {
  showFeedback: boolean;
  userAnswer: string | undefined;
  correctAnswer: string;
  comment?: string;
}

const QuestionFeedback: React.FC<QuestionFeedbackProps> = ({
  showFeedback,
  userAnswer,
  correctAnswer,
  comment,
}) => {
  if (!showFeedback || !userAnswer) return null;

  // Compare only the first letter, ignoring case
  const isCorrect = userAnswer.charAt(0).toLowerCase() === correctAnswer.charAt(0).toLowerCase();

  return (
    <FeedbackDisplay 
      isCorrect={isCorrect}
      correctAnswer={correctAnswer}
      comment={comment}
    />
  );
};

export default QuestionFeedback;
