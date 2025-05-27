
import React from 'react';
import FeedbackDisplay from './FeedbackDisplay';
import { useUserPreferences } from '@/contexts/UserPreferencesContext';

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
  const { preferences } = useUserPreferences();
  
  // Don't show feedback if:
  // 1. No feedback should be shown
  // 2. No user answer
  // 3. Immediate feedback is enabled (handled by AnswerSubmission)
  // 4. No comment to display
  if (!showFeedback || !userAnswer || preferences?.immediateFeedback || !comment) return null;

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
