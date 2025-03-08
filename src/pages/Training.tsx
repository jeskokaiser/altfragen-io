
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Question } from '@/types/models/Question';
import { AnswerState } from '@/types/models/Answer';
import { QuestionView, TrainingConfig } from '@/components/features';
import Results from '@/components/features/questions/Results';

const Training = () => {
  const navigate = useNavigate();
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<AnswerState[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [configurationComplete, setConfigurationComplete] = useState(false);

  useEffect(() => {
    const storedQuestions = localStorage.getItem('trainingQuestions');
    if (!storedQuestions) {
      navigate('/dashboard');
      return;
    }
    setAllQuestions(JSON.parse(storedQuestions));
  }, [navigate]);

  const handleStartTraining = (questions: Question[]) => {
    setSelectedQuestions(questions);
    setConfigurationComplete(true);
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
    return (
      <div className="container mx-auto py-8">
        <Results
          questions={selectedQuestions}
          userAnswers={userAnswers}
          onRestart={handleRestart}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
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
    </div>
  );
};

export default Training;
