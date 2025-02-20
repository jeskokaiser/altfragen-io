
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Question } from '@/types/Question';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';

interface ResultsProps {
  questions: Question[];
  userAnswers: string[];
  onRestart: () => void;
}

const Results: React.FC<ResultsProps> = ({ questions, userAnswers, onRestart }) => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const calculateScore = () => {
    return questions.reduce((score, question, index) => {
      const userAnswer = userAnswers[index] || "";
      if (userAnswer === 'solution_viewed') return score;
      const userAnswerLetter = userAnswer.trim()[0]?.toUpperCase();
      const correctAnswerLetter = question.correctAnswer.trim()[0]?.toUpperCase();
      return score + (userAnswerLetter === correctAnswerLetter ? 1 : 0);
    }, 0);
  };

  const renderUserAnswer = (userAnswer: string, question: Question) => {
    if (!userAnswer) return 'Keine Antwort';
    if (userAnswer === 'solution_viewed') return 'Lösung angezeigt';

    const userAnswerLetter = userAnswer.trim()[0]?.toUpperCase();
    if (!userAnswerLetter || !question[`option${userAnswerLetter}` as keyof Question]) {
      return 'Ungültige Antwort';
    }

    return `${userAnswerLetter}: ${question[`option${userAnswerLetter}` as keyof Question]}`;
  };

  return (
    <div className={`w-full max-w-2xl mx-auto ${isMobile ? 'px-2' : ''}`}>
      <h2 className="text-xl md:text-2xl font-semibold mb-4 text-slate-800">Deine Ergebnisse</h2>
      <div className="mb-4">
        <p className="text-base md:text-lg">
          Gesamtpunktzahl: {calculateScore()} von {questions.length} (
          {Math.round((calculateScore() / questions.length) * 100)}%)
        </p>
      </div>
      <div className="space-y-3">
        {questions.map((q, index) => {
          const userAnswer = userAnswers[index] || "";
          const userAnswerLetter = userAnswer === 'solution_viewed' ? null : userAnswer.trim()[0]?.toUpperCase();
          const correctAnswerLetter = q.correctAnswer.trim()[0]?.toUpperCase();
          const isCorrect = userAnswerLetter === correctAnswerLetter;

          return (
            <Card key={index} className={`${isMobile ? 'p-3' : 'p-4'}`}>
              <h3 className="font-medium text-slate-800 mb-2 text-sm md:text-base dark:text-white">
                Frage {index + 1}: {q.question}
              </h3>
              <div className="grid gap-3">
                <div>
                  <p className="text-xs md:text-sm text-slate-600 dark:text-white">Deine Antwort:</p>
                  <p
                    className={`mt-1 text-sm md:text-base ${
                      userAnswer === 'solution_viewed'
                        ? 'text-slate-600'
                        : isCorrect
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}
                  >
                    {renderUserAnswer(userAnswer, q)}
                  </p>
                </div>
                <div>
                  <p className="text-xs md:text-sm text-slate-600 dark:text-white">Richtige Antwort:</p>
                  <p className="mt-1 text-sm md:text-base text-green-600 dark:text-white">
                    {`${correctAnswerLetter}: ${q[
                      `option${correctAnswerLetter}` as keyof Question
                    ]}`}
                  </p>
                </div>
                {q.comment && (
                  <div>
                    <p className="text-xs md:text-sm text-slate-600">Kommentar:</p>
                    <p className="mt-1 text-sm md:text-base">{q.comment}</p>
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>
      <div className={`mt-6 flex ${isMobile ? 'flex-col' : ''} gap-3`}>
        <Button onClick={onRestart} className="w-full md:w-auto">Neuer Test</Button>
        <Button 
          variant="outline" 
          onClick={() => navigate('/dashboard')}
          className="w-full md:w-auto"
        >
          Zurück zum Dashboard
        </Button>
      </div>
    </div>
  );
};

export default Results;
