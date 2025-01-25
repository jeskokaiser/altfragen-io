import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Question } from '@/types/Question';
import { UserProgress } from '@/types/Progress';

interface ResultsProps {
  questions: Question[];
  userAnswers: string[];
  onRestart: () => void;
  progress: UserProgress;
}

const Results: React.FC<ResultsProps> = ({ questions, userAnswers, onRestart, progress }) => {
  const calculateScore = () => {
    return questions.reduce((score, question, index) => {
      return score + (question.correctAnswer === userAnswers[index] ? 1 : 0);
    }, 0);
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <h2 className="text-2xl font-semibold mb-6 text-slate-800">Ihre Ergebnisse</h2>
      <div className="mb-6">
        <p className="text-lg">
          Gesamtpunktzahl: {calculateScore()} von {questions.length} ({Math.round((calculateScore() / questions.length) * 100)}%)
        </p>
      </div>
      <div className="space-y-4">
        {questions.map((q, index) => {
          const questionProgress = progress[q.id];
          return (
            <Card key={index} className="p-4">
              <h3 className="font-medium text-slate-800 mb-2">Frage {index + 1}: {q.question}</h3>
              <div className="grid gap-4">
                <div>
                  <p className="text-sm text-slate-600">Ihre Antwort:</p>
                  <p className={`mt-1 ${userAnswers[index] === q.correctAnswer ? 'text-green-600' : 'text-red-600'}`}>
                    {userAnswers[index] ? `${userAnswers[index]}: ${q[`option${userAnswers[index]}` as keyof Question]}` : 'Keine Antwort'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Richtige Antwort:</p>
                  <p className="mt-1 text-green-600">
                    {q.correctAnswer}: {q[`option${q.correctAnswer}` as keyof Question]}
                  </p>
                </div>
                {questionProgress && (
                  <div className="text-sm text-slate-600">
                    <p>Bisherige Versuche: {questionProgress.correctAttempts + questionProgress.incorrectAttempts}</p>
                    <p>Erfolgsquote: {Math.round((questionProgress.correctAttempts / (questionProgress.correctAttempts + questionProgress.incorrectAttempts)) * 100)}%</p>
                    <p>Nächste Wiederholung: {new Date(questionProgress.nextReviewDate).toLocaleDateString()}</p>
                  </div>
                )}
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
      <Button onClick={onRestart} className="mt-6">
        Neuer Test
      </Button>
    </div>
  );
};

export default Results;