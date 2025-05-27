
import React, { useState, useEffect } from 'react';
import QuestionCard from '../training/QuestionCard';
import { Question } from '@/types/Question';

interface QuestionContentProps {
  questionData: Question;
  selectedAnswer: string;
  onAnswerChange: (answer: string) => void;
  onConfirmAnswer: () => void;
  showFeedback: boolean;
  wrongAnswers?: string[];
}

const QuestionContent: React.FC<QuestionContentProps> = ({
  questionData,
  selectedAnswer,
  onAnswerChange,
  onConfirmAnswer,
  showFeedback,
  wrongAnswers = [],
}) => {
  if (!questionData) {
    return <div>Loading question...</div>;
  }

  const answers = [
    { key: 'A', text: questionData.optionA },
    { key: 'B', text: questionData.optionB },
    { key: 'C', text: questionData.optionC },
    { key: 'D', text: questionData.optionD },
    { key: 'E', text: questionData.optionE },
  ];

  const handleAnswerSelect = (key: string, isCorrect: boolean) => {
    onAnswerChange(key);
  };

  return (
    <QuestionCard
      question={questionData.question}
      answers={answers}
      correctKey={questionData.correctAnswer}
      explanation={questionData.comment}
      onAnswerSelect={handleAnswerSelect}
      selectedAnswer={selectedAnswer}
      wrongAnswers={wrongAnswers}
    />
  );
};

export default QuestionContent;
