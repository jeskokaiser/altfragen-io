import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface QuestionDisplayProps {
  question: string;
  totalQuestions: number;
  currentIndex: number;
  onNext: () => void;
  onPrevious: () => void;
  onAnswer: (answer: string) => void;
  userAnswer: string;
}

const QuestionDisplay: React.FC<QuestionDisplayProps> = ({
  question,
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
          Question {currentIndex + 1} of {totalQuestions}
        </p>
      </div>

      <Card className="p-6">
        <h3 className="text-xl font-semibold mb-6 text-slate-800">{question}</h3>
        <textarea
          className="w-full p-3 border rounded-md min-h-[100px] focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="Type your answer here..."
          value={userAnswer}
          onChange={(e) => onAnswer(e.target.value)}
        />
      </Card>

      <div className="flex justify-between mt-6">
        <Button
          variant="outline"
          onClick={onPrevious}
          disabled={currentIndex === 0}
        >
          Previous
        </Button>
        <Button
          onClick={onNext}
        >
          {currentIndex === totalQuestions - 1 ? 'Finish' : 'Next'}
        </Button>
      </div>
    </div>
  );
};

export default QuestionDisplay;