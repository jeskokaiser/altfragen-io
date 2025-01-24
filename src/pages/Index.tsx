import React, { useState, useMemo } from 'react';
import FileUpload from '@/components/FileUpload';
import QuestionDisplay from '@/components/QuestionDisplay';
import Results from '@/components/Results';
import { Question } from '@/types/Question';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const Index = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<string[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<string>('');

  const subjects = useMemo(() => {
    const uniqueSubjects = Array.from(new Set(questions.map(q => q.subject)));
    return uniqueSubjects.sort();
  }, [questions]);

  const filteredQuestions = useMemo(() => {
    if (!selectedSubject) return questions;
    return questions.filter(q => q.subject === selectedSubject);
  }, [questions, selectedSubject]);

  const handleQuestionsLoaded = (loadedQuestions: Question[]) => {
    setQuestions(loadedQuestions);
    setUserAnswers(new Array(loadedQuestions.length).fill(''));
    setCurrentIndex(0);
    setShowResults(false);
    setSelectedSubject('');
  };

  const handleAnswer = (answer: string) => {
    const newAnswers = [...userAnswers];
    newAnswers[currentIndex] = answer;
    setUserAnswers(newAnswers);
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
    setSelectedSubject('');
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
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-slate-50">
      <div className="max-w-2xl mx-auto mb-6">
        <Select value={selectedSubject} onValueChange={setSelectedSubject}>
          <SelectTrigger>
            <SelectValue placeholder="Wähle ein Fach aus" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Alle Fächer</SelectItem>
            {subjects.map((subject) => (
              <SelectItem key={subject} value={subject}>
                {subject}
              </SelectItem>
            ))}
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