
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { Question } from '@/types/models/Question';
import { AnswerState } from '@/types/models/Answer';
import { toast } from 'sonner';

/**
 * Custom hook for managing the training state
 */
export const useTrainingState = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [configurationComplete, setConfigurationComplete] = useState(false);
  
  // Get questions from localStorage with proper error handling
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
  
  // Store user answers with localStorage
  const {
    value: userAnswers,
    setValue: setUserAnswers,
    isLoading: isLoadingAnswers
  } = useLocalStorage<AnswerState[]>('trainingUserAnswers', []);
  
  // Check for restart flag from results page
  useEffect(() => {
    if (location.state?.restart) {
      setUserAnswers([]);
      setConfigurationComplete(false);
      // Clear location state to prevent unexpected restarts
      window.history.replaceState({}, document.title);
    }
  }, [location.state, setUserAnswers]);
  
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
        navigate('/training/results', { state: { fromTraining: true } });
        return;
      }
      
      setConfigurationComplete(true);
    }
  }, [selectedQuestions, userAnswers, isLoadingSelected, isLoadingAnswers, navigate]);

  const handleStartTraining = (questions: Question[]) => {
    setSelectedQuestions(questions);
    setUserAnswers([]);
    setConfigurationComplete(true);
  };

  const handleErrorReset = () => {
    navigate('/dashboard');
  };

  return {
    allQuestions,
    selectedQuestions,
    userAnswers,
    isLoadingQuestions,
    isLoadingSelected,
    isLoadingAnswers,
    questionsError,
    configurationComplete,
    handleStartTraining,
    setSelectedQuestions,
    setUserAnswers,
    handleErrorReset,
    setConfigurationComplete
  };
};
