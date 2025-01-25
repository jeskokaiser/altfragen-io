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
  const { user } = useAuth();

  useEffect(() => {
    setSelectedAnswer('');
    setShowFeedback(false);
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
    // Since we're not managing the question state here anymore,
    // we'll just close the modal
    setIsEditModalOpen(false);
  };

  const handleDifficultyChange = async (value: string) => {
    if (!questionData) return;
    
    const newDifficulty = parseInt(value);
    if (isNaN(newDifficulty) || newDifficulty < 1 || newDifficulty > 5) return;

    try {
      const { error } = await supabase
        .from('questions')
        .update({ difficulty: newDifficulty })
        .eq('id', questionData.id);

      if (error) throw error;

      toast.success("Schwierigkeitsgrad aktualisiert");
    } catch (error) {
      console.error('Error updating difficulty:', error);
      toast.error("Fehler beim Aktualisieren des Schwierigkeitsgrads");
    }
  };

  if (!questionData) {
    return <div>Loading question...</div>;
  }

  const difficultyValue = questionData.difficulty?.toString() || '3';

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
            <DifficultyBadge difficulty={questionData.difficulty || 3} />
            <EditButton onClick={() => setIsEditModalOpen(true)} />
          </div>
          
          <DifficultyToggle 
            value={difficultyValue}
            onValueChange={handleDifficultyChange}
          />
        </div>

        <QuestionContent
          questionData={questionData}
          selectedAnswer={selectedAnswer}
          onAnswerChange={handleAnswerChange}
          onConfirmAnswer={() => {}}
          showFeedback={showFeedback}
        />

        <AnswerSubmission
          currentQuestion={questionData}
          selectedAnswer={selectedAnswer}
          user={user}
          onAnswerSubmitted={handleAnswerSubmitted}
        />

        {showFeedback && userAnswer && (
          <FeedbackDisplay 
            isCorrect={userAnswer.toLowerCase() === questionData.correctAnswer.toLowerCase()}
            correctAnswer={questionData.correctAnswer}
            comment={questionData.comment}
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
        question={questionData}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onQuestionUpdated={handleQuestionUpdate}
      />
    </div>
  );
};

export default QuestionDisplay;