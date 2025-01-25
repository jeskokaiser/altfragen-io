import React, { useState, useMemo, useEffect } from 'react';
import FileUpload from '@/components/FileUpload';
import QuestionDisplay from '@/components/QuestionDisplay';
import Results from '@/components/Results';
import { Question } from '@/types/Question';
import { UserProgress, QuestionProgress } from '@/types/Progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const PROGRESS_STORAGE_KEY = 'question_progress';

const calculateNextReviewDate = (correctAttempts: number, incorrectAttempts: number): Date => {
  // Implement spaced repetition algorithm
  // This is a simple example - you might want to use a more sophisticated algorithm
  const totalAttempts = correctAttempts + incorrectAttempts;
  const successRate = correctAttempts / totalAttempts;
  const baseDelay = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  
  let delay = baseDelay;
  if (successRate > 0.8) {
    delay *= Math.pow(2, correctAttempts); // Exponential increase for well-known questions
  }
  
  return new Date(Date.now() + delay);
};

const Index = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<string[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [questionCount, setQuestionCount] = useState<string>('all');
  const [progress, setProgress] = useState<UserProgress>({});

  useEffect(() => {
    // Load progress from localStorage
    const savedProgress = localStorage.getItem(PROGRESS_STORAGE_KEY);
    if (savedProgress) {
      setProgress(JSON.parse(savedProgress));
    }
  }, []);

  const subjects = useMemo(() => {
    const uniqueSubjects = Array.from(new Set(questions.map(q => q.subject)));
    return uniqueSubjects.sort();
  }, [questions]);

  const filteredQuestions = useMemo(() => {
    let filtered = selectedSubject === 'all' 
      ? questions 
      : questions.filter(q => q.subject === selectedSubject);
    
    // Sort questions by next review date if available
    filtered = filtered.sort((a, b) => {
      const progressA = progress[a.id];
      const progressB = progress[b.id];
      
      if (!progressA && !progressB) return 0;
      if (!progressA) return -1;
      if (!progressB) return 1;
      
      return new Date(progressA.nextReviewDate).getTime() - new Date(progressB.nextReviewDate).getTime();
    });
    
    if (questionCount !== 'all') {
      filtered = filtered.slice(0, parseInt(questionCount));
    }
    
    return filtered;
  }, [questions, selectedSubject, questionCount, progress]);

  const handleQuestionsLoaded = (loadedQuestions: Question[]) => {
    // Add unique IDs to questions if they don't have them
    const questionsWithIds = loadedQuestions.map((q, index) => ({
      ...q,
      id: q.id || `q-${index}-${Date.now()}`
    }));
    
    setQuestions(questionsWithIds);
    setUserAnswers(new Array(questionsWithIds.length).fill(''));
    setCurrentIndex(0);
    setShowResults(false);
    setSelectedSubject('all');
    setQuestionCount('all');
  };

  const updateProgress = (questionId: string, isCorrect: boolean) => {
    const currentProgress = progress[questionId] || {
      questionId,
      correctAttempts: 0,
      incorrectAttempts: 0,
      lastAttempted: new Date(),
      nextReviewDate: new Date()
    };

    const updatedProgress: QuestionProgress = {
      ...currentProgress,
      correctAttempts: currentProgress.correctAttempts + (isCorrect ? 1 : 0),
      incorrectAttempts: currentProgress.incorrectAttempts + (isCorrect ? 0 : 1),
      lastAttempted: new Date(),
      nextReviewDate: calculateNextReviewDate(
        currentProgress.correctAttempts + (isCorrect ? 1 : 0),
        currentProgress.incorrectAttempts + (isCorrect ? 0 : 1)
      )
    };

    const newProgress = { ...progress, [questionId]: updatedProgress };
    setProgress(newProgress);
    localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(newProgress));
  };

  const handleAnswer = (answer: string) => {
    const newAnswers = [...userAnswers];
    newAnswers[currentIndex] = answer;
    setUserAnswers(newAnswers);

    const currentQuestion = filteredQuestions[currentIndex];
    const isCorrect = answer === currentQuestion.correctAnswer;
    updateProgress(currentQuestion.id, isCorrect);
  };

  const handleNext = () => {
    if (currentIndex === filteredQuestions.length - 1) {
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
    setSelectedSubject('all');
    setQuestionCount('all');
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
          questions={filteredQuestions}
          userAnswers={userAnswers}
          onRestart={handleRestart}
          progress={progress}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-slate-50">
      <div className="max-w-2xl mx-auto space-y-4">
        <Select value={selectedSubject} onValueChange={setSelectedSubject}>
          <SelectTrigger>
            <SelectValue placeholder="Wähle ein Fach aus" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Fächer</SelectItem>
            {subjects.map((subject) => (
              <SelectItem key={subject} value={subject}>
                {subject}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={questionCount} onValueChange={setQuestionCount}>
          <SelectTrigger>
            <SelectValue placeholder="Anzahl der Fragen" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Fragen</SelectItem>
            <SelectItem value="5">5 Fragen</SelectItem>
            <SelectItem value="10">10 Fragen</SelectItem>
            <SelectItem value="15">15 Fragen</SelectItem>
            <SelectItem value="20">20 Fragen</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {filteredQuestions.length > 0 ? (
        <QuestionDisplay
          questionData={filteredQuestions[currentIndex]}
          totalQuestions={filteredQuestions.length}
          currentIndex={currentIndex}
          onNext={handleNext}
          onPrevious={handlePrevious}
          onAnswer={handleAnswer}
          userAnswer={userAnswers[currentIndex]}
          progress={progress[filteredQuestions[currentIndex].id]}
        />
      ) : (
        <div className="text-center text-gray-600">
          Keine Fragen für das ausgewählte Fach verfügbar.
        </div>
      )}
    </div>
  );
};

export default Index;