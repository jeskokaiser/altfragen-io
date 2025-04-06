
import React from 'react';
import { Card } from '@/components/ui/card';
import { Question } from '@/types/Question';
import QuestionControls from './QuestionControls';
import QuestionContent from './QuestionContent';
import QuestionImage from './QuestionImage';
import AnswerSubmission from '../training/AnswerSubmission';
import QuestionFeedback from '../training/QuestionFeedback';
import { User } from '@supabase/supabase-js';
import { useIsMobile } from '@/hooks/use-mobile';

interface QuestionContainerProps {
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

const QuestionContainer: React.FC<QuestionContainerProps> = ({
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
  onMarkUnclear,
}) => {
  const isMobile = useIsMobile();
  const shouldShowImage = question.image_key && 
    (!question.show_image_after_answer || (question.show_image_after_answer && showFeedback));

  return (
    <Card className={`${isMobile ? 'p-3' : 'p-6'}`}>
      <QuestionControls
        question={question}
        onEditClick={onEditClick}
        onMarkUnclear={onMarkUnclear}
      />

      {shouldShowImage && <QuestionImage imageKey={question.image_key} />}

      <QuestionContent
        questionData={question}
        selectedAnswer={selectedAnswer}
        onAnswerChange={onAnswerChange}
        onConfirmAnswer={() => {}}
        showFeedback={showFeedback}
        wrongAnswers={wrongAnswers}
      />

      <AnswerSubmission
        currentQuestion={question}
        selectedAnswer={selectedAnswer}
        user={user}
        onAnswerSubmitted={onAnswerSubmitted}
      />

      <QuestionFeedback
        showFeedback={showFeedback}
        userAnswer={userAnswer}
        correctAnswer={question.correctAnswer}
        comment={question.comment}
        isCorrect={isCorrect}
        wrongAnswers={wrongAnswers}
      />
    </Card>
  );
};

export default QuestionContainer;
