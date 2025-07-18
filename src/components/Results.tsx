import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Question } from '@/types/Question';
import { AnswerState } from '@/types/Answer';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import { useUserPreferences } from '@/contexts/UserPreferencesContext';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';

interface ResultsProps {
  questions: Question[];
  userAnswers: AnswerState[];
  onRestart: () => void;
}

const Results: React.FC<ResultsProps> = ({ questions, userAnswers, onRestart }) => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { preferences } = useUserPreferences();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Filter to only show answered questions
  const answeredQuestions = questions.filter((_, index) => userAnswers[index]?.value);
  const answeredUserAnswers = userAnswers.filter(answer => answer?.value);

  const calculateScore = () => {
    return answeredQuestions.reduce((score, question, index) => {
      const answer = answeredUserAnswers[index];
      if (!answer) return score;
      
      // In immediate feedback mode, don't check isFirstAttempt since every answer should count if correct
      if (preferences?.immediateFeedback) {
        const userAnswerLetter = answer.value.trim()[0]?.toUpperCase();
        const correctAnswerLetter = question.correctAnswer.trim()[0]?.toUpperCase();
        const isCorrect = userAnswerLetter === correctAnswerLetter;
        return score + (isCorrect ? 1 : 0);
      } else {
        // In normal mode, use the original logic
        if (!answer.isFirstAttempt || answer.viewedSolution) {
          return score;
        }
        
        const userAnswerLetter = answer.value.trim()[0]?.toUpperCase();
        const correctAnswerLetter = question.correctAnswer.trim()[0]?.toUpperCase();
        const isCorrect = userAnswerLetter === correctAnswerLetter;
        return score + (isCorrect ? 1 : 0);
      }
    }, 0);
  };

  const getAnswerStatusColor = (answer: AnswerState | undefined, correctLetter: string) => {
    if (!answer) return 'text-red-600';
    
    const userAnswerLetter = (answer.originalAnswer || answer.value).trim()[0]?.toUpperCase();
    const isCorrectAnswer = userAnswerLetter === correctLetter;

    // In immediate feedback mode, use simple correct/incorrect coloring
    if (preferences?.immediateFeedback) {
      return isCorrectAnswer ? 'text-green-600' : 'text-red-600';
    }
    
    // In normal mode, show red for non-first attempts or viewed solutions, even if eventually correct
    if (answer.viewedSolution || !answer.isFirstAttempt) {
      return 'text-red-600';
    }
    
    // First attempt without viewing solution: color by correctness
    return isCorrectAnswer ? 'text-green-600' : 'text-red-600';
  };

  const renderUserAnswer = (answer: AnswerState | undefined, question: Question) => {
    if (!answer) return 'Keine Antwort';
    
    const answerToShow = answer.originalAnswer || answer.value;
    const userAnswerLetter = answerToShow.trim()[0]?.toUpperCase();
    
    if (!userAnswerLetter || !question[`option${userAnswerLetter}` as keyof Question]) {
      return 'Ungültige Antwort';
    }

    const answerText = `${userAnswerLetter}: ${question[`option${userAnswerLetter}` as keyof Question]}`;
    const correctAnswerLetter = question.correctAnswer.trim()[0]?.toUpperCase();
    const isCorrectAnswer = userAnswerLetter === correctAnswerLetter;
    
    // In immediate feedback mode, just show the answer text without context flags
    if (preferences?.immediateFeedback) {
      return answerText;
    }
    
    // In normal mode, show context flags regardless of correctness
    if (answer.viewedSolution) {
      return `${answerText} (Lösung angezeigt)`;
    }
    if (!answer.isFirstAttempt) {
      return `${answerText} (Nicht der erste Versuch)`;
    }
    
    // No context flags to show, just return the answer text
    return answerText;
  };

  const handleNavigateToDashboard = () => {
    // Invalidate dashboard queries to ensure fresh data
    if (user) {
      queryClient.invalidateQueries({ queryKey: ['today-new', user.id] });
      queryClient.invalidateQueries({ queryKey: ['today-practice', user.id] });
      queryClient.invalidateQueries({ queryKey: ['total-answers', user.id] });
      queryClient.invalidateQueries({ queryKey: ['total-attempts', user.id] });
      queryClient.invalidateQueries({ queryKey: ['user-progress', user.id] });
      queryClient.invalidateQueries({ queryKey: ['all-questions', user.id] });
    }
    navigate('/dashboard');
  };

  return (
    <div className={`w-full max-w-2xl mx-auto ${isMobile ? 'px-2' : ''}`}>
      <h2 className="text-xl md:text-2xl font-semibold mb-4 text-slate-800">Deine Ergebnisse</h2>
      <div className="mb-4">
        <p className="text-base md:text-lg">
          Gesamtpunktzahl: {calculateScore()} von {answeredQuestions.length} (
          {answeredQuestions.length > 0 ? Math.round((calculateScore() / answeredQuestions.length) * 100) : 0}%)
        </p>
      </div>
      <div className="space-y-3">
        {answeredQuestions.map((q, index) => {
          const answer = answeredUserAnswers[index];
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
          onClick={handleNavigateToDashboard}
          className="w-full md:w-auto"
        >
          Zurück zum Dashboard
        </Button>
      </div>
    </div>
  );
};

export default Results;
