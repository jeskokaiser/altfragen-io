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
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [questionCount, setQuestionCount] = useState<string>('all');

  const subjects = useMemo(() => {
    const uniqueSubjects = Array.from(new Set(questions.map(q => q.subject)));
    return uniqueSubjects.sort();
  }, [questions]);

  const filteredQuestions = useMemo(() => {
    let filtered = selectedSubject === 'all' 
      ? questions 
      : questions.filter(q => q.subject === selectedSubject);
    
    if (questionCount !== 'all') {
      filtered = filtered.slice(0, parseInt(questionCount));
    }
    
    return filtered;
  }, [questions, selectedSubject, questionCount]);

  const handleQuestionsLoaded = (loadedQuestions: Question[]) => {
    setQuestions(loadedQuestions);
    setUserAnswers(new Array(loadedQuestions.length).fill(''));
    setCurrentIndex(0);
    setShowResults(false);
    setSelectedSubject('all');
    setQuestionCount('all');
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