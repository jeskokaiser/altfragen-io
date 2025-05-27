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
  wrongAnswers?: string[];
  firstWrongAnswer?: string | null;
  correctAnswer?: string;
  isOverallCorrect?: boolean;
  allOtherOptionsAttemptedAndWrong?: boolean;
}

const QuestionContent: React.FC<QuestionContentProps> = ({
  questionData,
  selectedAnswer,
  onAnswerChange,
  onConfirmAnswer,
  showFeedback,
  wrongAnswers = [],
  firstWrongAnswer,
  correctAnswer,
  isOverallCorrect,
  allOtherOptionsAttemptedAndWrong,
}) => {
  const [resetTrigger, setResetTrigger] = useState(0);

  useEffect(() => {
    setResetTrigger(prev => prev + 1);
  }, [questionData]);

   const highlightNicht = (text: string) => {
    return text.split(/(nicht|falsch|kein|keine)/i).map((part, index) =>
      ['nicht', 'falsch', 'kein', 'keine'].includes(part.toLowerCase()) ? (
        <u key={index}>{part}</u>
      ) : (
        part
      )
    );
  };

  if (!questionData) {
    return <div>Loading question...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="mb-4">
        <h3 className="text-xl font-semibold text-slate-800 dark:text-white">
          {highlightNicht(questionData.question)}
        </h3>
      </div>
      <RadioGroup value={selectedAnswer} onValueChange={onAnswerChange}>
        <AnswerOption 
          value="A" 
          text={questionData.optionA} 
          resetTrigger={resetTrigger} 
          isSelected={selectedAnswer === 'A'}
          isWrong={wrongAnswers.includes('A')}
          isFirstWrong={firstWrongAnswer === 'A'}
          isOptionCorrect={correctAnswer === 'A'}
          showFeedback={showFeedback}
          allOtherOptionsAttemptedAndWrong={allOtherOptionsAttemptedAndWrong}
        />
        <AnswerOption 
          value="B" 
          text={questionData.optionB} 
          resetTrigger={resetTrigger} 
          isSelected={selectedAnswer === 'B'}
          isWrong={wrongAnswers.includes('B')}
          isFirstWrong={firstWrongAnswer === 'B'}
          isOptionCorrect={correctAnswer === 'B'}
          showFeedback={showFeedback}
          allOtherOptionsAttemptedAndWrong={allOtherOptionsAttemptedAndWrong}
        />
        <AnswerOption 
          value="C" 
          text={questionData.optionC} 
          resetTrigger={resetTrigger} 
          isSelected={selectedAnswer === 'C'}
          isWrong={wrongAnswers.includes('C')}
          isFirstWrong={firstWrongAnswer === 'C'}
          isOptionCorrect={correctAnswer === 'C'}
          showFeedback={showFeedback}
          allOtherOptionsAttemptedAndWrong={allOtherOptionsAttemptedAndWrong}
        />
        <AnswerOption 
          value="D" 
          text={questionData.optionD} 
          resetTrigger={resetTrigger} 
          isSelected={selectedAnswer === 'D'}
          isWrong={wrongAnswers.includes('D')}
          isFirstWrong={firstWrongAnswer === 'D'}
          isOptionCorrect={correctAnswer === 'D'}
          showFeedback={showFeedback}
          allOtherOptionsAttemptedAndWrong={allOtherOptionsAttemptedAndWrong}
        />
        <AnswerOption 
          value="E" 
          text={questionData.optionE} 
          resetTrigger={resetTrigger} 
          isSelected={selectedAnswer === 'E'}
          isWrong={wrongAnswers.includes('E')}
          isFirstWrong={firstWrongAnswer === 'E'}
          isOptionCorrect={correctAnswer === 'E'}
          showFeedback={showFeedback}
          allOtherOptionsAttemptedAndWrong={allOtherOptionsAttemptedAndWrong}
        />
      </RadioGroup>
    </div>
  );
};

export default QuestionContent;
