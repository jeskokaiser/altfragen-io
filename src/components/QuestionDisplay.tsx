import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Question } from '@/types/Question';
import { useAuth } from '@/contexts/AuthContext';
import QuestionHeader from './training/QuestionHeader';
import QuestionContent from './training/QuestionContent';
import FeedbackDisplay from './training/FeedbackDisplay';
import NavigationButtons from './training/NavigationButtons';
import EditQuestionModal from './training/EditQuestionModal';
import AnswerSubmission from './training/AnswerSubmission';
import DifficultyBadge from './training/DifficultyBadge';
import DifficultyToggle from './training/DifficultyToggle';
import EditButton from './training/EditButton';
import { supabase } from '@/integrations/supabase/client';
import { toast } from "sonner";

interface QuestionDisplayProps {
  questionData: Question;
  totalQuestions: number;
  currentIndex: number;
  onNext: () => void;
  onPrevious: () => void;
  onAnswer: (answer: string) => void;
  userAnswer: string;
  onQuit: () => void;
}

const QuestionDisplay: React.FC<QuestionDisplayProps> = ({
  questionData,
  totalQuestions,
  currentIndex,
  onNext,
  onPrevious,
  onAnswer,
  userAnswer,
  onQuit,
}) => {
  const [showFeedback, setShowFeedback] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (questionData) {
      setCurrentQuestion(questionData);
    }
  }, [questionData]);

  const handleAnswerChange = (answer: string) => {
    setSelectedAnswer(answer);
  };

  const handleAnswerSubmitted = (answer: string) => {
    onAnswer(answer);
    setShowFeedback(true);
  };

  const handleNext = () => {
    setShowFeedback(false);
    setSelectedAnswer('');
    onNext();
  };

  const handleQuestionUpdate = (updatedQuestion: Question) => {
    setCurrentQuestion(updatedQuestion);
  };

  const handleDifficultyChange = async (value: string) => {
    if (!currentQuestion) return;
    
    const newDifficulty = parseInt(value);
    if (isNaN(newDifficulty) || newDifficulty < 1 || newDifficulty > 5) return;

    try {
      const { error } = await supabase
        .from('questions')
        .update({ difficulty: newDifficulty })
        .eq('id', currentQuestion.id);

      if (error) throw error;

      setCurrentQuestion({ ...currentQuestion, difficulty: newDifficulty });
      toast.success("Schwierigkeitsgrad aktualisiert");
    } catch (error) {
      console.error('Error updating difficulty:', error);
      toast.error("Fehler beim Aktualisieren des Schwierigkeitsgrads");
    }
  };

  if (!currentQuestion) {
    return <div>Loading question...</div>;
  }

  const difficultyValue = currentQuestion.difficulty?.toString() || '3';

  return (
    <div className="w-full max-w-2xl mx-auto">
      <QuestionHeader
        currentIndex={currentIndex}
        totalQuestions={totalQuestions}
        onQuit={onQuit}
      />

      <Card className="p-6">
        <div className="flex flex-col gap-4 mb-4">
          <div className="flex justify-between items-center">
            <DifficultyBadge difficulty={currentQuestion.difficulty || 3} />
            <EditButton onClick={() => setIsEditModalOpen(true)} />
          </div>
          
          <DifficultyToggle 
            value={difficultyValue}
            onValueChange={handleDifficultyChange}
          />
        </div>

        <QuestionContent
          questionData={currentQuestion}
          selectedAnswer={selectedAnswer}
          onAnswerChange={handleAnswerChange}
          onConfirmAnswer={() => {}}
          showFeedback={showFeedback}
        />

        <AnswerSubmission
          currentQuestion={currentQuestion}
          selectedAnswer={selectedAnswer}
          user={user}
          onAnswerSubmitted={handleAnswerSubmitted}
        />

        {showFeedback && userAnswer && (
          <FeedbackDisplay 
            isCorrect={userAnswer.toLowerCase() === currentQuestion.correctAnswer.toLowerCase()}
            correctAnswer={currentQuestion.correctAnswer}
            comment={currentQuestion.comment}
          />
        )}
      </Card>

      <NavigationButtons
        onPrevious={onPrevious}
        onNext={handleNext}
        isFirstQuestion={currentIndex === 0}
        isLastQuestion={currentIndex === totalQuestions - 1}
        hasUserAnswer={!!userAnswer}
      />

      <EditQuestionModal
        question={currentQuestion}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onQuestionUpdated={handleQuestionUpdate}
      />
    </div>
  );
};

export default QuestionDisplay;