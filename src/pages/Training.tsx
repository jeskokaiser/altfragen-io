import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Question } from '@/types/Question';
import QuestionDisplay from '@/components/QuestionDisplay';
import Results from '@/components/Results';

const Training = () => {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<string[]>([]);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    const storedQuestions = localStorage.getItem('trainingQuestions');
    if (!storedQuestions) {
      navigate('/');
      return;
    }
    setQuestions(JSON.parse(storedQuestions));
  }, [navigate]);

  const handleAnswer = (answer: string) => {
    const newAnswers = [...userAnswers];
    newAnswers[currentQuestionIndex] = answer;
    setUserAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
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
  };

  if (questions.length === 0) {
    return <div>Loading...</div>;
  }

  if (showResults) {
    return (
      <div className="container mx-auto py-8">
        <Results
          questions={questions}
          userAnswers={userAnswers}
          onRestart={handleRestart}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <QuestionDisplay
        questionData={questions[currentQuestionIndex]}
        totalQuestions={questions.length}
        currentIndex={currentQuestionIndex}
        onNext={handleNext}
        onPrevious={handlePrevious}
        onAnswer={handleAnswer}
        userAnswer={userAnswers[currentQuestionIndex]}
      />
    </div>
  );
};

export default Training;