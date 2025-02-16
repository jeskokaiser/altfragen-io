
import React from 'react';
import FeedbackDisplay from './FeedbackDisplay';

interface QuestionFeedbackProps {
  showFeedback: boolean;
  userAnswer: string | undefined;
  correctAnswer: string;
  comment?: string;
  isCorrect: boolean;
  wrongAnswers: string[];
}

const QuestionFeedback: React.FC<QuestionFeedbackProps> = ({
  showFeedback,
  userAnswer,
  correctAnswer,
  comment,
  isCorrect,
  wrongAnswers,
}) => {
  if (!showFeedback || !userAnswer) return null;

  // Show feedback when either answer is correct OR when all wrong answers have been tried
  const shouldShowFeedback = isCorrect || wrongAnswers.length >= 4;
  if (!shouldShowFeedback) return null;

  return (
    <FeedbackDisplay 
      isCorrect={isCorrect}
      correctAnswer={correctAnswer}
      comment={comment}
    />
  );
};

export default QuestionFeedback;
