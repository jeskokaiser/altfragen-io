
import React, { useState, useEffect } from 'react';
import { RadioGroup } from "@/components/ui/radio-group";
import AnswerOption from '@/components/features/questions/AnswerOption';
import { Question } from '@/types/models/Question';

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
  const [resetTrigger, setResetTrigger] = useState(0);
  const [localSelectedAnswer, setLocalSelectedAnswer] = useState(selectedAnswer);

  // Sync local state with parent state
  useEffect(() => {
    setLocalSelectedAnswer(selectedAnswer);
  }, [selectedAnswer]);

  useEffect(() => {
    setResetTrigger(prev => prev + 1);
    setLocalSelectedAnswer(''); // Reset selected answer when question changes
  }, [questionData]);

  const highlightNicht = (text: string) => {
    return text.split(/(nicht|falsch|keiner|keinen|keine|kein|wenigsten)/i).map((part, index) =>
      ['nicht', 'falsch', 'keiner','keinen', 'keine', 'kein', 'wenigsten'].includes(part.toLowerCase()) ? (
        <u key={index}>{part}</u>
      ) : (
        part
      )
    );
  };

  const handleAnswerSelection = (value: string) => {
    console.log("Answer selected in QuestionContent:", value);
    setLocalSelectedAnswer(value);
    onAnswerChange(value);
  };

  if (!questionData) {
    return <div>Loading question...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-xl font-semibold text-slate-800 dark:text-white">
          {highlightNicht(questionData.question)}
        </h3>    
      </div>
      <RadioGroup 
        value={localSelectedAnswer} 
        onValueChange={handleAnswerSelection}
        className="space-y-2"
      >
        <AnswerOption value="A" text={questionData.optionA} resetTrigger={resetTrigger} isWrong={wrongAnswers.includes('A')} />
        <AnswerOption value="B" text={questionData.optionB} resetTrigger={resetTrigger} isWrong={wrongAnswers.includes('B')} />
        <AnswerOption value="C" text={questionData.optionC} resetTrigger={resetTrigger} isWrong={wrongAnswers.includes('C')} />
        <AnswerOption value="D" text={questionData.optionD} resetTrigger={resetTrigger} isWrong={wrongAnswers.includes('D')} />
        <AnswerOption value="E" text={questionData.optionE} resetTrigger={resetTrigger} isWrong={wrongAnswers.includes('E')} />
      </RadioGroup>
    </div>
  );
};

export default QuestionContent;
