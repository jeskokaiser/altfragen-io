import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Question } from '@/types/Question';

interface QuestionDisplayProps {
  questionData: Question;
  totalQuestions: number;
  currentIndex: number;
  onNext: () => void;
  onPrevious: () => void;
  onAnswer: (answer: string) => void;
  userAnswer: string;
}

const QuestionDisplay: React.FC<QuestionDisplayProps> = ({
  questionData,
  totalQuestions,
  currentIndex,
  onNext,
  onPrevious,
  onAnswer,
  userAnswer,
}) => {
  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="mb-8">
        <div className="w-full bg-slate-200 h-2 rounded-full">
          <div
            className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / totalQuestions) * 100}%` }}
          />
        </div>
        <p className="text-right text-sm text-slate-600 mt-2">
          Frage {currentIndex + 1} von {totalQuestions}
        </p>
      </div>

      <Card className="p-6">
        <h3 className="text-xl font-semibold mb-6 text-slate-800">{questionData.question}</h3>
        <div className="space-y-4">
          <RadioGroup value={userAnswer} onValueChange={onAnswer}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="A" id="A" />
              <Label htmlFor="A">{questionData.optionA}</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="B" id="B" />
              <Label htmlFor="B">{questionData.optionB}</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="C" id="C" />
              <Label htmlFor="C">{questionData.optionC}</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="D" id="D" />
              <Label htmlFor="D">{questionData.optionD}</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="E" id="E" />
              <Label htmlFor="E">{questionData.optionE}</Label>
            </div>
          </RadioGroup>
        </div>
      </Card>

      <div className="flex justify-between mt-6">
        <Button
          variant="outline"
          onClick={onPrevious}
          disabled={currentIndex === 0}
        >
          Zurück
        </Button>
        <Button
          onClick={onNext}
        >
          {currentIndex === totalQuestions - 1 ? 'Fertig' : 'Weiter'}
        </Button>
      </div>
    </div>
  );
};

export default QuestionDisplay;