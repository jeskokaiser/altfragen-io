
import React from 'react';
import { useTrainingState } from '@/hooks/use-training-state';
import { TrainingConfig } from '@/components/features';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { 
  TrainingLoadingState, 
  ErrorDisplay,
  EmptyQuestionsDisplay 
} from '@/components/features/training/LoadingAndError';
import TrainingManager from '@/components/features/training/TrainingManager';

const Training = () => {
  const {
    allQuestions,
    selectedQuestions,
    userAnswers,
    isLoadingQuestions,
    isLoadingSelected,
    isLoadingAnswers,
    questionsError,
    configurationComplete,
    handleStartTraining,
    setUserAnswers,
    handleErrorReset
  } = useTrainingState();

  // Show loading state
  if (isLoadingQuestions || isLoadingSelected || isLoadingAnswers) {
    return <TrainingLoadingState />;
  }
  
  // Show error state
  if (questionsError) {
    return <ErrorDisplay error={questionsError} onReset={handleErrorReset} />;
  }

  // Show empty state
  if (allQuestions.length === 0) {
    return <EmptyQuestionsDisplay />;
  }

  // Show configuration screen
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

  // Show training session
  return (
    <TrainingManager 
      selectedQuestions={selectedQuestions}
      userAnswers={userAnswers}
      setUserAnswers={setUserAnswers}
      onErrorReset={handleErrorReset}
    />
  );
};

export default Training;
