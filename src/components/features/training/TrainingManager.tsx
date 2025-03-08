
import React, { useState } from 'react';
import { Question } from '@/types/models/Question';
import { AnswerState } from '@/types/models/Answer';
import { QuestionView } from '@/components/features';
import { useNavigate } from 'react-router-dom';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';

interface TrainingManagerProps {
  selectedQuestions: Question[];
  userAnswers: AnswerState[];
  setUserAnswers: (answers: AnswerState[]) => void;
  onErrorReset: () => void;
}

const TrainingManager: React.FC<TrainingManagerProps> = ({
  selectedQuestions,
  userAnswers,
  setUserAnswers,
  onErrorReset
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const navigate = useNavigate();

  const handleAnswer = (answer: string, isFirstAttempt: boolean, viewedSolution: boolean) => {
    const newAnswers = [...userAnswers];
    const currentAnswer = newAnswers[currentQuestionIndex];
    
    if (viewedSolution) {
      newAnswers[currentQuestionIndex] = {
        value: answer,
        isFirstAttempt: currentAnswer?.isFirstAttempt ?? currentAnswer?.attempts?.length === 0 ?? true,
        viewedSolution: true,
        attempts: currentAnswer?.attempts ?? [],
        originalAnswer: currentAnswer?.originalAnswer || currentAnswer?.value || answer
      };
    } else {
      const attempts = currentAnswer?.attempts ?? [];
      const isActualFirstAttempt = attempts.length === 0;
      
      newAnswers[currentQuestionIndex] = {
        value: answer,
        isFirstAttempt: isActualFirstAttempt,
        viewedSolution: currentAnswer?.viewedSolution ?? false,
        attempts: [...attempts, answer],
        originalAnswer: currentAnswer?.originalAnswer
      };
    }
    
    setUserAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentQuestionIndex < selectedQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      navigate('/training/results', { state: { fromTraining: true } });
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleQuit = () => {
    navigate('/training/results', { state: { fromTraining: true } });
  };

  const handleQuestionUpdate = (updatedQuestion: Question) => {
    const updatedQuestions = selectedQuestions.map(q => 
      q.id === updatedQuestion.id ? updatedQuestion : q
    );
    // This will update the parent component's state
    // The parent should provide a setter for selectedQuestions
  };

  return (
    <div className="container mx-auto py-8">
      <ErrorBoundary onReset={onErrorReset}>
        <QuestionView
          questionData={selectedQuestions[currentQuestionIndex]}
          totalQuestions={selectedQuestions.length}
          currentIndex={currentQuestionIndex}
          onNext={handleNext}
          onPrevious={handlePrevious}
          onAnswer={handleAnswer}
          userAnswer={userAnswers[currentQuestionIndex]}
          onQuit={handleQuit}
          onQuestionUpdate={handleQuestionUpdate}
        />
      </ErrorBoundary>
    </div>
  );
};

export default TrainingManager;
