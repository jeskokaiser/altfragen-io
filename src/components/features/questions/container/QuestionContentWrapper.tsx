
import React from 'react';
import { Question } from '@/types/models/Question';
import QuestionContainer from '@/components/features/questions/QuestionContainer';
import { User } from '@supabase/supabase-js';

interface QuestionContentWrapperProps {
  question: Question;
  showFeedback: boolean;
  selectedAnswer: string;
  onAnswerChange: (answer: string) => void;
  userAnswer: string;
  isCorrect: boolean;
  wrongAnswers: string[];
  user: User | null;
  onAnswerSubmitted: (answer: string, correct: boolean, showSolution?: boolean) => void;
  onEditClick: () => void;
  onMarkUnclear: () => void;
}

const QuestionContentWrapper: React.FC<QuestionContentWrapperProps> = ({
  question,
  showFeedback,
  selectedAnswer,
  onAnswerChange,
  userAnswer,
  isCorrect,
  wrongAnswers,
  user,
  onAnswerSubmitted,
  onEditClick,
  onMarkUnclear
}) => {
  return (
    <QuestionContainer
      question={question}
      showFeedback={showFeedback}
      selectedAnswer={selectedAnswer}
      onAnswerChange={onAnswerChange}
      userAnswer={userAnswer}
      isCorrect={isCorrect}
      wrongAnswers={wrongAnswers}
      user={user}
      onAnswerSubmitted={onAnswerSubmitted}
      onEditClick={onEditClick}
      onMarkUnclear={onMarkUnclear}
    />
  );
};

export default QuestionContentWrapper;
