import React, { useState, useEffect } from 'react';
import { RadioGroup } from "@/components/ui/radio-group";
import AnswerOption from './AnswerOption';
import { Question } from '@/types/Question';
import { useUserPreferences } from '@/contexts/UserPreferencesContext';
import { getKeyDisplayName } from '@/hooks/useTrainingKeyboard';

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
  showSolution?: boolean;
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
  showSolution,
}) => {
  const [resetTrigger, setResetTrigger] = useState(0);
  const { preferences } = useUserPreferences();

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

  // Show green highlight for correct answer only when:
  // 1. The correct answer was clicked, OR
  // 2. All wrong answers have been tried (4 wrong attempts)
  const shouldHighlightCorrect = showFeedback && (isCorrect || wrongAnswers.length >= 4);

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
          isCorrect={correctAnswer?.charAt(0).toLowerCase() === 'a'}
          showFeedback={showFeedback}
          shouldHighlightCorrect={shouldHighlightCorrect}
          showSolution={showSolution}
          keyboardShortcut={getKeyDisplayName(preferences.keyboardBindings.answerA)}
        />
        <AnswerOption 
          value="B" 
          text={questionData.optionB} 
          resetTrigger={resetTrigger} 
          isWrong={wrongAnswers.includes('B')}
          isFirstWrong={firstWrongAnswer === 'B'}
          isCorrect={correctAnswer?.charAt(0).toLowerCase() === 'b'}
          showFeedback={showFeedback}
          shouldHighlightCorrect={shouldHighlightCorrect}
          showSolution={showSolution}
          keyboardShortcut={getKeyDisplayName(preferences.keyboardBindings.answerB)}
        />
        <AnswerOption 
          value="C" 
          text={questionData.optionC} 
          resetTrigger={resetTrigger} 
          isWrong={wrongAnswers.includes('C')}
          isFirstWrong={firstWrongAnswer === 'C'}
          isCorrect={correctAnswer?.charAt(0).toLowerCase() === 'c'}
          showFeedback={showFeedback}
          shouldHighlightCorrect={shouldHighlightCorrect}
          showSolution={showSolution}
          keyboardShortcut={getKeyDisplayName(preferences.keyboardBindings.answerC)}
        />
        <AnswerOption 
          value="D" 
          text={questionData.optionD} 
          resetTrigger={resetTrigger} 
          isWrong={wrongAnswers.includes('D')}
          isFirstWrong={firstWrongAnswer === 'D'}
          isCorrect={correctAnswer?.charAt(0).toLowerCase() === 'd'}
          showFeedback={showFeedback}
          shouldHighlightCorrect={shouldHighlightCorrect}
          showSolution={showSolution}
          keyboardShortcut={getKeyDisplayName(preferences.keyboardBindings.answerD)}
        />
        <AnswerOption 
          value="E" 
          text={questionData.optionE} 
          resetTrigger={resetTrigger} 
          isWrong={wrongAnswers.includes('E')}
          isFirstWrong={firstWrongAnswer === 'E'}
          isCorrect={correctAnswer?.charAt(0).toLowerCase() === 'e'}
          showFeedback={showFeedback}
          shouldHighlightCorrect={shouldHighlightCorrect}
          showSolution={showSolution}
          keyboardShortcut={getKeyDisplayName(preferences.keyboardBindings.answerE)}
        />
      </RadioGroup>
    </div>
  );
};

export default QuestionContent;
