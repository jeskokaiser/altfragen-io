import React, { useState } from 'react';
import FileUpload from '@/components/FileUpload';
import QuestionDisplay from '@/components/QuestionDisplay';
import Results from '@/components/Results';
import { Question } from '@/types/Question';

const Index = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<string[]>([]);
  const [showResults, setShowResults] = useState(false);

  const handleQuestionsLoaded = (loadedQuestions: Question[]) => {
    setQuestions(loadedQuestions);
    setUserAnswers(new Array(loadedQuestions.length).fill(''));
    setCurrentIndex(0);
    setShowResults(false);
  };

  const handleAnswer = (answer: string) => {
    const newAnswers = [...userAnswers];
    newAnswers[currentIndex] = answer;
    setUserAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentIndex === questions.length - 1) {
      setShowResults(true);
    } else {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrevious = () => {
    setCurrentIndex(Math.max(0, currentIndex - 1));
  };

  const handleRestart = () => {
    setQuestions([]);
    setUserAnswers([]);
    setCurrentIndex(0);
    setShowResults(false);
  };

  if (questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <FileUpload onQuestionsLoaded={handleQuestionsLoaded} />
      </div>
    );
  }

  if (showResults) {
    return (
      <div className="min-h-screen p-6 bg-slate-50">
        <Results
          questions={questions}
          userAnswers={userAnswers}
          onRestart={handleRestart}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-slate-50">
      <QuestionDisplay
        questionData={questions[currentIndex]}
        totalQuestions={questions.length}
        currentIndex={currentIndex}
        onNext={handleNext}
        onPrevious={handlePrevious}
        onAnswer={handleAnswer}
        userAnswer={userAnswers[currentIndex]}
      />
    </div>
  );
};

export default Index;