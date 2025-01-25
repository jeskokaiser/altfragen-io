import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Question } from '@/types/Question';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Pencil } from 'lucide-react';
import QuestionHeader from './training/QuestionHeader';
import QuestionContent from './training/QuestionContent';
import FeedbackDisplay from './training/FeedbackDisplay';
import NavigationButtons from './training/NavigationButtons';
import EditQuestionModal from './training/EditQuestionModal';

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
  const [currentQuestion, setCurrentQuestion] = useState<Question>(questionData);
  const { user } = useAuth();

  // Update current question when questionData prop changes
  useEffect(() => {
    setCurrentQuestion(questionData);
  }, [questionData]);

  const handleAnswerChange = (answer: string) => {
    setSelectedAnswer(answer);
  };

  const handleConfirmAnswer = async () => {
    if (!selectedAnswer || !user) return;

    onAnswer(selectedAnswer);
    setShowFeedback(true);

    try {
      // First try to update existing progress
      const { data: existingProgress, error: fetchError } = await supabase
        .from('user_progress')
        .select()
        .eq('user_id', user.id)
        .eq('question_id', currentQuestion.id)
        .single();

      if (existingProgress) {
        // Update existing record
        const { error: updateError } = await supabase
          .from('user_progress')
          .update({
            user_answer: selectedAnswer,
            is_correct: selectedAnswer.toLowerCase() === currentQuestion.correctAnswer.toLowerCase()
          })
          .eq('user_id', user.id)
          .eq('question_id', currentQuestion.id);

        if (updateError) throw updateError;
      } else {
        // Insert new record
        const { error: insertError } = await supabase
          .from('user_progress')
          .insert({
            user_id: user.id,
            question_id: currentQuestion.id,
            user_answer: selectedAnswer,
            is_correct: selectedAnswer.toLowerCase() === currentQuestion.correctAnswer.toLowerCase()
          });

        if (insertError) throw insertError;
      }
    } catch (error: any) {
      console.error('Error saving progress:', error);
      toast.error("Fehler beim Speichern des Fortschritts");
    }
  };

  const handleNext = () => {
    setShowFeedback(false);
    setSelectedAnswer('');
    onNext();
  };

  const handleQuestionUpdate = (updatedQuestion: Question) => {
    setCurrentQuestion(updatedQuestion);
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <QuestionHeader
        currentIndex={currentIndex}
        totalQuestions={totalQuestions}
        onQuit={onQuit}
      />

      <Card className="p-6">
        <div className="flex justify-end mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditModalOpen(true)}
            className="flex items-center gap-2"
          >
            <Pencil className="h-4 w-4" />
            Bearbeiten
          </Button>
        </div>

        <QuestionContent
          questionData={currentQuestion}
          selectedAnswer={selectedAnswer}
          onAnswerChange={handleAnswerChange}
          onConfirmAnswer={handleConfirmAnswer}
          showFeedback={showFeedback}
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