
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Question } from '@/types/Question';
import { AnswerState } from '@/types/Answer';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';

interface ResultsProps {
  questions: Question[];
  userAnswers: AnswerState[];
  onRestart: () => void;
}

const Results: React.FC<ResultsProps> = ({ questions, userAnswers, onRestart }) => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const calculateScore = () => {
    return questions.reduce((score, question, index) => {
      const answer = userAnswers[index];
      if (!answer || !answer.isFirstAttempt || answer.viewedSolution) return score;
      
      const userAnswerLetter = answer.value.trim()[0]?.toUpperCase();
      const correctAnswerLetter = question.correctAnswer.trim()[0]?.toUpperCase();
      return score + (userAnswerLetter === correctAnswerLetter ? 1 : 0);
    }, 0);
  };

  const getAnswerStatusColor = (answer: AnswerState | undefined, correctLetter: string) => {
    if (!answer) return 'text-slate-600';
    
    const userAnswerLetter = answer.value.trim()[0]?.toUpperCase();
    const isCorrectAnswer = userAnswerLetter === correctLetter;

    if (answer.viewedSolution) return 'text-slate-600';
    if (!answer.isFirstAttempt) return 'text-red-600'; // Always red if not first attempt
    return isCorrectAnswer ? 'text-green-600' : 'text-red-600';
  };

  const renderUserAnswer = (answer: AnswerState | undefined, question: Question) => {
    if (!answer) return 'Keine Antwort';
    
    const userAnswerLetter = answer.value.trim()[0]?.toUpperCase();
    if (!userAnswerLetter || !question[`option${userAnswerLetter}` as keyof Question]) {
      return 'Ungültige Antwort';
    }

    const answerText = `${userAnswerLetter}: ${question[`option${userAnswerLetter}` as keyof Question]}`;
    if (answer.viewedSolution) {
      return `${answerText} (Lösung angezeigt)`;
    }
    if (!answer.isFirstAttempt) {
      return `${answerText} (Nicht der erste Versuch)`;
    }
    return answerText;
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
          const answer = userAnswers[index];
          const correctAnswerLetter = q.correctAnswer.trim()[0]?.toUpperCase();

          return (
            <Card key={index} className={`${isMobile ? 'p-3' : 'p-4'}`}>
              <h3 className="font-medium text-slate-800 mb-2 text-sm md:text-base dark:text-white">
                Frage {index + 1}: {q.question}
              </h3>
              <div className="grid gap-3">
                <div>
                  <p className="text-xs md:text-sm text-slate-600 dark:text-white">Deine Antwort:</p>
                  <p className={`mt-1 text-sm md:text-base ${getAnswerStatusColor(answer, correctAnswerLetter)}`}>
                    {renderUserAnswer(answer, q)}
                  </p>
                </div>
                <div>
                  <p className="text-xs md:text-sm text-slate-600 dark:text-white">Richtige Antwort:</p>
                  <p className="mt-1 text-sm md:text-base text-green-600 dark:text-white">
                    {`${correctAnswerLetter}: ${q[`option${correctAnswerLetter}` as keyof Question]}`}
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
