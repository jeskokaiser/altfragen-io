import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Question } from '@/types/Question';
import { useNavigate } from 'react-router-dom';

interface ResultsProps {
  questions: Question[];
  userAnswers: string[];
  onRestart: () => void;
}

const Results: React.FC<ResultsProps> = ({ questions, userAnswers, onRestart }) => {
  const navigate = useNavigate();

  const calculateScore = () => {
    return questions.reduce((score, question, index) => {
      const userAnswer = userAnswers[index] || "";
      const userAnswerLetter = userAnswer.trim()[0]?.toUpperCase();
      const correctAnswerLetter = question.correctAnswer.trim()[0]?.toUpperCase();
      return score + (userAnswerLetter === correctAnswerLetter ? 1 : 0);
    }, 0);
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <h2 className="text-2xl font-semibold mb-6 text-slate-800">Deine Ergebnisse</h2>
      <div className="mb-6">
        <p className="text-lg">
          Gesamtpunktzahl: {calculateScore()} von {questions.length} (
          {Math.round((calculateScore() / questions.length) * 100)}%)
        </p>
      </div>
      <div className="space-y-4">
        {questions.map((q, index) => {
          // Get the first letter of the user's answer and the correct answer,
          // after trimming whitespace and converting to uppercase.
          const userAnswer = userAnswers[index] || "";
          const userAnswerLetter = userAnswer.trim()[0]?.toUpperCase();
          const correctAnswerLetter = q.correctAnswer.trim()[0]?.toUpperCase();

          return (
            <Card key={index} className="p-4">
              <h3 className="font-medium text-slate-800 mb-2">
                Frage {index + 1}: {q.question}
              </h3>
              <div className="grid gap-4">
                <div>
                  <p className="text-sm text-slate-600">Deine Antwort:</p>
                  <p
                    className={`mt-1 ${
                      userAnswerLetter === correctAnswerLetter
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}
                  >
                    {userAnswerLetter
                      ? `${userAnswerLetter}: ${q[
                          `option${userAnswerLetter}` as keyof Question
                        ]}`
                      : 'Keine Antwort'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Richtige Antwort:</p>
                  <p className="mt-1 text-green-600">
                    {`${correctAnswerLetter}: ${q[
                      `option${correctAnswerLetter}` as keyof Question
                    ]}`}
                  </p>
                </div>
                {q.comment && (
                  <div>
                    <p className="text-sm text-slate-600">Kommentar:</p>
                    <p className="mt-1">{q.comment}</p>
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>
      <div className="mt-6 flex gap-4">
        <Button onClick={onRestart}>Neuer Test</Button>
        <Button variant="outline" onClick={() => navigate('/dashboard')}>
          Zurück zum Dashboard
        </Button>
      </div>
    </div>
  );
};

export default Results;