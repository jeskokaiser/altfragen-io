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

  return (
    <FeedbackDisplay 
      isCorrect={userAnswer.toLowerCase() === correctAnswer.toLowerCase()}
      correctAnswer={correctAnswer}
      comment={comment}
    />
  );
};

export default QuestionFeedback;