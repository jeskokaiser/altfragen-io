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
  isCorrect?: boolean;
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
  isCorrect,
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
          isWrong={wrongAnswers.includes('A')}
          isFirstWrong={firstWrongAnswer === 'A'}
          isCorrect={showFeedback && correctAnswer === 'A'}
          showFeedback={showFeedback}
        />
        <AnswerOption 
          value="B" 
          text={questionData.optionB} 
          resetTrigger={resetTrigger} 
          isWrong={wrongAnswers.includes('B')}
          isFirstWrong={firstWrongAnswer === 'B'}
          isCorrect={showFeedback && correctAnswer === 'B'}
          showFeedback={showFeedback}
        />
        <AnswerOption 
          value="C" 
          text={questionData.optionC} 
          resetTrigger={resetTrigger} 
          isWrong={wrongAnswers.includes('C')}
          isFirstWrong={firstWrongAnswer === 'C'}
          isCorrect={showFeedback && correctAnswer === 'C'}
          showFeedback={showFeedback}
        />
        <AnswerOption 
          value="D" 
          text={questionData.optionD} 
          resetTrigger={resetTrigger} 
          isWrong={wrongAnswers.includes('D')}
          isFirstWrong={firstWrongAnswer === 'D'}
          isCorrect={showFeedback && correctAnswer === 'D'}
          showFeedback={showFeedback}
        />
        <AnswerOption 
          value="E" 
          text={questionData.optionE} 
          resetTrigger={resetTrigger} 
          isWrong={wrongAnswers.includes('E')}
          isFirstWrong={firstWrongAnswer === 'E'}
          isCorrect={showFeedback && correctAnswer === 'E'}
          showFeedback={showFeedback}
        />
      </RadioGroup>
    </div>
  );
};

export default QuestionContent;
