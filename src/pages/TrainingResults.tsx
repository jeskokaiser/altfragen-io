
import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { Question } from '@/types/models/Question';
import { AnswerState } from '@/types/models/Answer';
import Results from '@/components/features/questions/Results';
import LoadingFallback from '@/components/common/LoadingFallback';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';

const TrainingResults = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Use our custom localStorage hook with proper error handling and loading states
  const {
    value: selectedQuestions,
    isLoading: isLoadingSelected,
    error: selectedError
  } = useLocalStorage<Question[]>('currentTrainingQuestions', []);
  
  // Store user answers with localStorage to maintain progress
  const {
    value: userAnswers,
    isLoading: isLoadingAnswers,
    error: answersError
  } = useLocalStorage<AnswerState[]>('trainingUserAnswers', []);
  
  // Redirect if coming directly to results page without completing training
  useEffect(() => {
    // Check if we're missing data and didn't get here from the training page
    if (!isLoadingSelected && !isLoadingAnswers && 
        (!selectedQuestions?.length || !userAnswers?.length) && 
        !location.state?.fromTraining) {
      navigate('/training');
    }
  }, [selectedQuestions, userAnswers, isLoadingSelected, isLoadingAnswers, navigate, location.state]);

  const handleRestart = () => {
    navigate('/training', { state: { restart: true } });
  };
  
  const handleErrorReset = () => {
    navigate('/dashboard');
  };
  
  if (isLoadingSelected || isLoadingAnswers) {
    return <LoadingFallback message="Lade Ergebnisse..." />;
  }
  
  if (selectedError || answersError) {
    return (
      <div className="container mx-auto py-8">
        <div className="p-6 bg-red-50 dark:bg-red-950/20 rounded-lg text-center">
          <h2 className="text-xl font-semibold text-red-800 dark:text-red-400 mb-2">
            Fehler beim Laden
          </h2>
          <p className="text-red-600 dark:text-red-300 mb-4">
            {(selectedError || answersError)?.message || 'Trainingsergebnisse konnten nicht geladen werden.'}
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
};

export default TrainingResults;
