import React, { useState, useEffect } from 'react';
import { RadioGroup } from "@/components/ui/radio-group";
import AnswerOption from './AnswerOption';
import { Question } from '@/types/Question';

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
      <h3 className="text-xl font-semibold mb-6 text-slate-800 dark:text-white">{questionData.question}</h3>
      <RadioGroup value={selectedAnswer} onValueChange={onAnswerChange}>
        <AnswerOption value="A" text={questionData.optionA} resetTrigger={resetTrigger} />
        <AnswerOption value="B" text={questionData.optionB} resetTrigger={resetTrigger} />
        <AnswerOption value="C" text={questionData.optionC} resetTrigger={resetTrigger} />
        <AnswerOption value="D" text={questionData.optionD} resetTrigger={resetTrigger} />
        <AnswerOption value="E" text={questionData.optionE} resetTrigger={resetTrigger} />
      </RadioGroup>
    </div>
  );
};

export default QuestionContent;