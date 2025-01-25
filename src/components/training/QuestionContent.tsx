import React from 'react';
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
  if (!questionData) {
    return <div>Loading question...</div>;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold mb-6 text-slate-800">{questionData.question}</h3>
      <RadioGroup value={selectedAnswer} onValueChange={onAnswerChange}>
        <AnswerOption value="A" text={questionData.optionA} />
        <AnswerOption value="B" text={questionData.optionB} />
        <AnswerOption value="C" text={questionData.optionC} />
        <AnswerOption value="D" text={questionData.optionD} />
        <AnswerOption value="E" text={questionData.optionE} />
      </RadioGroup>
    </div>
  );
};

export default QuestionContent;