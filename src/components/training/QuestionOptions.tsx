
import React from 'react';
import { RadioGroup } from "@/components/ui/radio-group";
import AnswerOption from './AnswerOption';
import { Question } from '@/types/Question';

interface QuestionOptionsProps {
  questionData: Question;
  selectedAnswer: string;
  onAnswerChange: (answer: string) => void;
  resetTrigger: number;
}

const QuestionOptions: React.FC<QuestionOptionsProps> = ({
  questionData,
  selectedAnswer,
  onAnswerChange,
  resetTrigger,
}) => {
  return (
    <RadioGroup value={selectedAnswer} onValueChange={onAnswerChange}>
      <AnswerOption value="A" text={questionData.optionA} resetTrigger={resetTrigger} />
      <AnswerOption value="B" text={questionData.optionB} resetTrigger={resetTrigger} />
      <AnswerOption value="C" text={questionData.optionC} resetTrigger={resetTrigger} />
      <AnswerOption value="D" text={questionData.optionD} resetTrigger={resetTrigger} />
      <AnswerOption value="E" text={questionData.optionE} resetTrigger={resetTrigger} />
    </RadioGroup>
  );
};

export default QuestionOptions;
