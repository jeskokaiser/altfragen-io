
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Question } from '@/types/models/Question';
import { AnswerState } from '@/types/models/Answer';
import { QuestionView, TrainingConfig } from '@/components/features';
import Results from '@/components/features/questions/Results';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import LoadingFallback from '@/components/common/LoadingFallback';
import { toast } from 'sonner';

const Training = () => {
  const navigate = useNavigate();
  const [configurationComplete, setConfigurationComplete] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showResults, setShowResults] = useState(false);
  
  // Use our custom localStorage hook with proper error handling and loading states
  const {
    value: allQuestions,
    setValue: setAllQuestions,
    isLoading: isLoadingQuestions,
    error: questionsError
  } = useLocalStorage<Question[]>('trainingQuestions', [], {
    expirationMs: 24 * 60 * 60 * 1000 // Expire after 24 hours
  });
  
  // Store selected questions with localStorage
  const {
    value: selectedQuestions,
    setValue: setSelectedQuestions,
    isLoading: isLoadingSelected
  } = useLocalStorage<Question[]>('currentTrainingQuestions', []);
  
  // Store user answers with localStorage to maintain progress
  const {
    value: userAnswers,
    setValue: setUserAnswers,
    isLoading: isLoadingAnswers
  } = useLocalStorage<AnswerState[]>('trainingUserAnswers', []);
  
  // Check for questions and redirect if none found
  useEffect(() => {
    if (!isLoadingQuestions && (!allQuestions || allQuestions.length === 0)) {
      toast.error('Keine Fragen gefunden', {
        description: 'Bitte wähle zuerst einen Datensatz aus.'
      });
      navigate('/dashboard');
    }
  }, [allQuestions, isLoadingQuestions, navigate]);
  
  // Detect if training was in progress and restore state
  useEffect(() => {
    if (!isLoadingSelected && !isLoadingAnswers && selectedQuestions.length > 0 && userAnswers.length > 0) {
      const hasCompletedTraining = userAnswers.length === selectedQuestions.length && 
        userAnswers.every(answer => answer?.value);
      
      if (hasCompletedTraining) {
        setShowResults(true);
      }
      
      setConfigurationComplete(true);
    }
  }, [selectedQuestions, userAnswers, isLoadingSelected, isLoadingAnswers]);

  const handleStartTraining = (questions: Question[]) => {
    setSelectedQuestions(questions);
    setUserAnswers([]);
    setCurrentQuestionIndex(0);
    setConfigurationComplete(true);
    setShowResults(false);
  };

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
      setShowResults(true);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleRestart = () => {
    setCurrentQuestionIndex(0);
    setUserAnswers([]);
    setShowResults(false);
    setConfigurationComplete(false);
  };

  const handleQuit = () => {
    setShowResults(true);
  };

  const handleQuestionUpdate = (updatedQuestion: Question) => {
    const updatedQuestions = selectedQuestions.map(q => 
      q.id === updatedQuestion.id ? updatedQuestion : q
    );
    setSelectedQuestions(updatedQuestions);
  };
  
  const handleErrorReset = () => {
    navigate('/dashboard');
  };

  // Show loading state
  if (isLoadingQuestions || isLoadingSelected || isLoadingAnswers) {
    return <LoadingFallback message="Lade Trainingsdaten..." />;
  }
  
  // Show error state
  if (questionsError) {
    return (
      <div className="container mx-auto py-8">
        <div className="p-6 bg-red-50 dark:bg-red-950/20 rounded-lg text-center">
          <h2 className="text-xl font-semibold text-red-800 dark:text-red-400 mb-2">
            Fehler beim Laden
          </h2>
          <p className="text-red-600 dark:text-red-300 mb-4">
            {questionsError.message || 'Trainingsdaten konnten nicht geladen werden.'}
          </p>
          <button 
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Zurück zum Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (allQuestions.length === 0) {
    return (
      <div className="container mx-auto py-8">
        <div className="p-6 bg-muted rounded-lg text-center">
          <h2 className="text-xl font-semibold mb-2">Keine Fragen vorhanden</h2>
          <p className="mb-4">Bitte wähle zuerst einen Datensatz aus.</p>
          <button 
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Zum Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!configurationComplete) {
    return (
      <div className="container mx-auto py-8">
        <ErrorBoundary onReset={handleErrorReset}>
          <TrainingConfig 
            questions={allQuestions}
            onStart={handleStartTraining}
          />
        </ErrorBoundary>
      </div>
    );
  }

  if (showResults) {
    return (
      <div className="container mx-auto py-8">
        <ErrorBoundary onReset={handleErrorReset}>
          <Results
            questions={selectedQuestions}
            userAnswers={userAnswers}
            onRestart={handleRestart}
          />
        </ErrorBoundary>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <ErrorBoundary onReset={handleErrorReset}>
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

export default Training;
