import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface ResultsProps {
  questions: Array<{ question: string; answer: string }>;
  userAnswers: string[];
  onRestart: () => void;
}

const Results: React.FC<ResultsProps> = ({ questions, userAnswers, onRestart }) => {
  return (
    <div className="w-full max-w-2xl mx-auto">
      <h2 className="text-2xl font-semibold mb-6 text-slate-800">Your Results</h2>
      <div className="space-y-4">
        {questions.map((q, index) => (
          <Card key={index} className="p-4">
            <h3 className="font-medium text-slate-800 mb-2">Question {index + 1}: {q.question}</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-600">Your Answer:</p>
                <p className="mt-1">{userAnswers[index] || 'No answer provided'}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Correct Answer:</p>
                <p className="mt-1">{q.answer}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
      <Button onClick={onRestart} className="mt-6">
        Start New Quiz
      </Button>
    </div>
  );
};

export default Results;