
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Question } from '@/types/Question';
import { AnswerState } from '@/types/Answer';
import QuestionDisplayWithAI from '@/components/training/QuestionDisplayWithAI';
import Results from '@/components/Results';
import TrainingConfig from '@/components/training/TrainingConfig';

const Training = () => {
  const navigate = useNavigate();
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<AnswerState[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [configurationComplete, setConfigurationComplete] = useState(false);
  const [isDemo, setIsDemo] = useState(false);
  const [ignoredQuestions, setIgnoredQuestions] = useState<Set<string>>(new Set());

  useEffect(() => {
    const demoFlag = localStorage.getItem('isDemoSession');
    const isDemoSession = demoFlag === 'true';
    setIsDemo(isDemoSession);

    const storedQuestions = localStorage.getItem('trainingQuestions');
    if (!storedQuestions) {
      navigate('/dashboard');
      return;
    }
    const parsedQuestions = JSON.parse(storedQuestions);
    setAllQuestions(parsedQuestions);

    if (isDemoSession) {
      setSelectedQuestions(parsedQuestions);
      setConfigurationComplete(true);
    }
    
    return () => {
      if (isDemoSession) {
        localStorage.removeItem('isDemoSession');
        localStorage.removeItem('demoAiCommentaries');
        localStorage.removeItem('trainingQuestions');
      }
    };
  }, [navigate]);

  const handleStartTraining = (questions: Question[]) => {
    setSelectedQuestions(questions);
    setConfigurationComplete(true);
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

  const handleNext = () => {
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
    if (!isDemo) {
      setConfigurationComplete(false);
    }
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
