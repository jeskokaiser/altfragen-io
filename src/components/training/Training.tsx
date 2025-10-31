import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Question } from '@/types/Question';
import { AnswerState } from '@/types/Answer';
import QuestionDisplayWithAI from '@/components/training/QuestionDisplayWithAI';
import Results from '@/components/Results';
import TrainingConfig from '@/components/training/TrainingConfig';
import { FormValues } from '@/components/training/types/FormValues';
import { fetchQuestionDetails } from '@/services/DatabaseService';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';

const Training: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
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

    const storedFilterSettings = localStorage.getItem('trainingFilterSettings');
    if (storedFilterSettings) {
      try {
        const parsedSettings = JSON.parse(storedFilterSettings);
        setFilterSettings(parsedSettings);
      } catch (error) {
        console.error('Error parsing filter settings:', error);
      }
    }

    setSelectedQuestions(parsedQuestions);
    setConfigurationComplete(false);
  }, [navigate]);

  useEffect(() => {
    if (configurationComplete && !showResults) {
      const savedPosition = scrollPositions.get(currentQuestionIndex);
      if (savedPosition !== undefined) {
        setTimeout(() => {
          window.scrollTo(0, savedPosition);
        }, 0);
      }
    }
  }, [currentQuestionIndex, configurationComplete, showResults, scrollPositions]);

  const handleStartTraining = async (questions: Question[], settings: FormValues) => {
    setFilterSettings(settings);
    localStorage.setItem('trainingFilterSettings', JSON.stringify(settings));

    const questionIds = questions.map(q => q.id);
    try {
      const fullQuestions = await fetchQuestionDetails(questionIds);

      const fullQuestionsMap = new Map(fullQuestions.map(q => [q.id, q]));

      const questionsWithDetails = questions.map(q => 
        fullQuestionsMap.get(q.id) || q
      );

      setSelectedQuestions(questionsWithDetails);
      setUserAnswers(new Array(questionsWithDetails.length).fill({
        // initial placeholder; will be replaced on first answer
        // using the AnswerState shape in handleAnswer
        // @ts-ignore
        selectedAnswer: null,
        // @ts-ignore
        isCorrect: null,
        // @ts-ignore
        hasAnswered: false
      } as any));
      setConfigurationComplete(true);
      setScrollPositions(new Map());

      setTimeout(() => {
        window.scrollTo(0, 0);
      }, 0);
    } catch (error) {
      console.error('Error fetching question details:', error);
      setSelectedQuestions(questions);
      setUserAnswers(new Array(questions.length).fill({
        // @ts-ignore
        selectedAnswer: null,
        // @ts-ignore
        isCorrect: null,
        // @ts-ignore
        hasAnswered: false
      } as any));
      setConfigurationComplete(true);
      setScrollPositions(new Map());

      setTimeout(() => {
        window.scrollTo(0, 0);
      }, 0);
    }
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
      } as any;
    } else {
      const attempts = currentAnswer?.attempts ?? [];
      const isActualFirstAttempt = attempts.length === 0;

      newAnswers[currentQuestionIndex] = {
        value: answer,
        isFirstAttempt: isActualFirstAttempt,
        viewedSolution: currentAnswer?.viewedSolution ?? false,
        attempts: [...attempts, answer],
        originalAnswer: currentAnswer?.originalAnswer
      } as any;
    }

    setUserAnswers(newAnswers);
  };

  const saveScrollPosition = () => {
    setScrollPositions(prev => new Map(prev.set(currentQuestionIndex, window.scrollY)));
  };

  const handleNext = () => {
    saveScrollPosition();

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
    saveScrollPosition();

    let prevIndex = currentQuestionIndex - 1;
    while (prevIndex >= 0 && ignoredQuestions.has(selectedQuestions[prevIndex].id)) {
      prevIndex--;
    }

    if (prevIndex >= 0) {
      setCurrentQuestionIndex(prevIndex);
    }
  };

  const handleQuestionIgnored = (questionId: string) => {
    setIgnoredQuestions(prev => new Set([...prev, questionId]));
  };

  const handleRestart = () => {
    if (user) {
      queryClient.invalidateQueries({ queryKey: ['today-new', user.id] });
      queryClient.invalidateQueries({ queryKey: ['today-practice', user.id] });
      queryClient.invalidateQueries({ queryKey: ['total-answers', user.id] });
      queryClient.invalidateQueries({ queryKey: ['total-attempts', user.id] });
      queryClient.invalidateQueries({ queryKey: ['user-progress', user.id] });
    }

    setCurrentQuestionIndex(0);
    setUserAnswers([]);
    setShowResults(false);
    setIgnoredQuestions(new Set());
    setScrollPositions(new Map());
    setConfigurationComplete(false);
  };

  const handleQuit = () => {
    if (user) {
      queryClient.invalidateQueries({ queryKey: ['today-new', user.id] });
      queryClient.invalidateQueries({ queryKey: ['today-practice', user.id] });
      queryClient.invalidateQueries({ queryKey: ['total-answers', user.id] });
      queryClient.invalidateQueries({ queryKey: ['total-attempts', user.id] });
      queryClient.invalidateQueries({ queryKey: ['user-progress', user.id] });
    }

    setShowResults(true);
  };

  const handleQuestionUpdate = (updatedQuestion: Question) => {
    const updatedQuestions = selectedQuestions.map(q => 
      q.id === updatedQuestion.id ? updatedQuestion : q
    );
    setSelectedQuestions(updatedQuestions);
  };

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
    setShowResults(true);
    return null;
  }

  const effectiveTotalQuestions = selectedQuestions.length - ignoredQuestions.size;
  const effectiveCurrentIndex = selectedQuestions.slice(0, currentQuestionIndex)
    .filter(q => !ignoredQuestions.has(q.id)).length;

  return (
    <div className="bg-slate-50 min-h-screen">
      <div className="py-8">
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
    </div>
  );
};

export default Training; 