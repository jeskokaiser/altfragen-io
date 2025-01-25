import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Question } from '@/types/Question';
import QuestionDisplay from '@/components/QuestionDisplay';
import Results from '@/components/Results';
import TrainingConfig from '@/components/training/TrainingConfig';

const Training = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<string[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [configurationComplete, setConfigurationComplete] = useState(false);

  useEffect(() => {
    // Check if we're in exam mode (questions passed through state)
    if (location.state?.examQuestions) {
      setSelectedQuestions(location.state.examQuestions);
      setConfigurationComplete(true);
      return;
    }

    // Regular training mode
    const storedQuestions = localStorage.getItem('trainingQuestions');
    if (!storedQuestions) {
      navigate('/');
      return;
    }
    setAllQuestions(JSON.parse(storedQuestions));
  }, [navigate, location.state]);

  const handleStartTraining = (questions: Question[]) => {
    setSelectedQuestions(questions);
    setConfigurationComplete(true);
  };

  const handleAnswer = (answer: string) => {
    const newAnswers = [...userAnswers];
    newAnswers[currentQuestionIndex] = answer;
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
    navigate('/');
  };

  if (!configurationComplete && !location.state?.examQuestions) {
    if (allQuestions.length === 0) {
      return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
    }

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

  if (selectedQuestions.length === 0) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <QuestionDisplay
        questionData={selectedQuestions[currentQuestionIndex]}
        totalQuestions={selectedQuestions.length}
        currentIndex={currentQuestionIndex}
        onNext={handleNext}
        onPrevious={handlePrevious}
        onAnswer={handleAnswer}
        userAnswer={userAnswers[currentQuestionIndex]}
        onQuit={handleQuit}
      />
    </div>
  );
};

export default Training;