
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Question } from '@/types/Question';
import { AnswerState } from '@/types/Answer';
import QuestionDisplayWithAI from '@/components/training/QuestionDisplayWithAI';
import Results from '@/components/Results';
import TrainingConfig from '@/components/training/TrainingConfig';
import { FormValues } from '@/components/training/types/FormValues';

const Training = () => {
  const navigate = useNavigate();
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<AnswerState[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [configurationComplete, setConfigurationComplete] = useState(false);
  const [ignoredQuestions, setIgnoredQuestions] = useState<Set<string>>(new Set());
  const [scrollPositions, setScrollPositions] = useState<Map<number, number>>(new Map());
  const [filterSettings, setFilterSettings] = useState<FormValues | null>(null);

  useEffect(() => {
    const storedQuestions = localStorage.getItem('trainingQuestions');
    if (!storedQuestions) {
      navigate('/dashboard');
      return;
    }
    const parsedQuestions = JSON.parse(storedQuestions);
    setAllQuestions(parsedQuestions);

    // Load filter settings if available
    const storedFilterSettings = localStorage.getItem('trainingFilterSettings');
    if (storedFilterSettings) {
      try {
        const parsedSettings = JSON.parse(storedFilterSettings);
        setFilterSettings(parsedSettings);
      } catch (error) {
        console.error('Error parsing filter settings:', error);
      }
    }

    // For regular sessions, always start with configuration
    setSelectedQuestions(parsedQuestions);
    setConfigurationComplete(false);
  }, [navigate]);

  // Restore scroll position when question changes
  useEffect(() => {
    if (configurationComplete && !showResults) {
      const savedPosition = scrollPositions.get(currentQuestionIndex);
      if (savedPosition !== undefined) {
        // Use setTimeout to ensure DOM is updated
        setTimeout(() => {
          window.scrollTo(0, savedPosition);
        }, 0);
      }
    }
  }, [currentQuestionIndex, configurationComplete, showResults, scrollPositions]);

  const handleStartTraining = (questions: Question[], settings: FormValues) => {
    setSelectedQuestions(questions);
    setFilterSettings(settings);
    setConfigurationComplete(true);
    setScrollPositions(new Map()); // Clear any existing scroll positions
    // Store filter settings for future use
    localStorage.setItem('trainingFilterSettings', JSON.stringify(settings));
    // Scroll to top when starting training
    setTimeout(() => {
      window.scrollTo(0, 0);
    }, 0);
  };

  const handleAnswer = (answer: string, isFirstAttempt: boolean, viewedSolution: boolean) => {
    const newAnswers = [...userAnswers];
    const currentAnswer = newAnswers[currentQuestionIndex];
    
    if (viewedSolution) {
      // If viewing solution, preserve the first answer ever made
      newAnswers[currentQuestionIndex] = {
        value: answer,
        // Keep existing isFirstAttempt or determine based on attempts
        isFirstAttempt: currentAnswer?.isFirstAttempt ?? currentAnswer?.attempts?.length === 0 ?? true,
        viewedSolution: true,
        // Keep existing attempts or initialize
        attempts: currentAnswer?.attempts ?? [],
        // Preserve the very first answer or use the current value if no previous answer exists
        originalAnswer: currentAnswer?.originalAnswer || currentAnswer?.value || answer
      };
    } else {
      // Regular answer submission
      const attempts = currentAnswer?.attempts ?? [];
      const isActualFirstAttempt = attempts.length === 0;
      
      newAnswers[currentQuestionIndex] = {
        value: answer,
        // isFirstAttempt is now determined by the attempts array
        isFirstAttempt: isActualFirstAttempt,
        viewedSolution: currentAnswer?.viewedSolution ?? false,
        attempts: [...attempts, answer],
        // Preserve existing originalAnswer if it exists
        originalAnswer: currentAnswer?.originalAnswer
      };
    }
    
    setUserAnswers(newAnswers);
  };

  // Save current scroll position before navigation
  const saveScrollPosition = () => {
    setScrollPositions(prev => new Map(prev.set(currentQuestionIndex, window.scrollY)));
  };



  const handleNext = () => {
    // Save current scroll position
    saveScrollPosition();
    
    // Find next question that hasn't been ignored
    let nextIndex = currentQuestionIndex + 1;
    while (nextIndex < selectedQuestions.length && ignoredQuestions.has(selectedQuestions[nextIndex].id)) {
      nextIndex++;
    }

    if (nextIndex < selectedQuestions.length) {
      setCurrentQuestionIndex(nextIndex);
    } else {
      setShowResults(true);
    }
  };

  const handlePrevious = () => {
    // Save current scroll position
    saveScrollPosition();
    
    // Find previous question that hasn't been ignored
    let prevIndex = currentQuestionIndex - 1;
    while (prevIndex >= 0 && ignoredQuestions.has(selectedQuestions[prevIndex].id)) {
      prevIndex--;
    }

    if (prevIndex >= 0) {
      setCurrentQuestionIndex(prevIndex);
    }
  };

  const handleQuestionIgnored = (questionId: string) => {
    // Add question to ignored set
    setIgnoredQuestions(prev => new Set([...prev, questionId]));
  };

  const handleRestart = () => {
    setCurrentQuestionIndex(0);
    setUserAnswers([]);
    setShowResults(false);
    setIgnoredQuestions(new Set());
    setScrollPositions(new Map()); // Clear saved scroll positions
    // Always go back to config to allow re-filtering with updated user progress
    setConfigurationComplete(false);
  };

  const handleQuit = () => {
    setShowResults(true);  // Show results instead of navigating away
  };

  const handleQuestionUpdate = (updatedQuestion: Question) => {
    const updatedQuestions = selectedQuestions.map(q => 
      q.id === updatedQuestion.id ? updatedQuestion : q
    );
    setSelectedQuestions(updatedQuestions);
  };

  // Find current non-ignored question
  const getCurrentQuestion = () => {
    let index = currentQuestionIndex;
    while (index < selectedQuestions.length && ignoredQuestions.has(selectedQuestions[index].id)) {
      index++;
    }
    return index < selectedQuestions.length ? selectedQuestions[index] : null;
  };

  const currentQuestion = getCurrentQuestion();

  if (allQuestions.length === 0) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  if (!configurationComplete) {
    return (
      <div className="container mx-auto py-8">
        <TrainingConfig 
          questions={allQuestions}
          onStart={handleStartTraining}
        />
      </div>
    );
  }

  if (showResults) {
    // Filter out ignored questions from results
    const resultsQuestions = selectedQuestions.filter(q => !ignoredQuestions.has(q.id));
    const resultsAnswers = userAnswers.filter((_, index) => !ignoredQuestions.has(selectedQuestions[index]?.id));
    
    return (
      <div className="container mx-auto py-8">
        <Results
          questions={resultsQuestions}
          userAnswers={resultsAnswers}
          onRestart={handleRestart}
        />
      </div>
    );
  }

  if (!currentQuestion) {
    // No more non-ignored questions, show results
    setShowResults(true);
    return null;
  }

  // Calculate effective total questions (excluding ignored ones)
  const effectiveTotalQuestions = selectedQuestions.length - ignoredQuestions.size;
  // Calculate effective current index (position among non-ignored questions)
  const effectiveCurrentIndex = selectedQuestions.slice(0, currentQuestionIndex)
    .filter(q => !ignoredQuestions.has(q.id)).length;

  return (
    <div className="container mx-auto py-8">
      <QuestionDisplayWithAI
        questionData={currentQuestion}
        totalQuestions={effectiveTotalQuestions}
        currentIndex={effectiveCurrentIndex}
        onNext={handleNext}
        onPrevious={handlePrevious}
        onAnswer={handleAnswer}
        userAnswer={userAnswers[currentQuestionIndex]?.value || ''}
        userAnswerState={userAnswers[currentQuestionIndex]}
        onQuit={handleQuit}
        onQuestionUpdate={handleQuestionUpdate}
        onQuestionIgnored={handleQuestionIgnored}
      />
    </div>
  );
};

export default Training;
