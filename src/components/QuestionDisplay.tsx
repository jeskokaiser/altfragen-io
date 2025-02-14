
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Question } from '@/types/Question';
import { useAuth } from '@/contexts/AuthContext';
import QuestionContent from './training/QuestionContent';
import NavigationButtons from './training/NavigationButtons';
import EditQuestionModal from './training/EditQuestionModal';
import AnswerSubmission from './training/AnswerSubmission';
import DifficultyControls from './training/DifficultyControls';
import QuestionFeedback from './training/QuestionFeedback';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';

interface QuestionDisplayProps {
  questionData: Question;
  totalQuestions: number;
  currentIndex: number;
  onNext: () => void;
  onPrevious: () => void;
  onAnswer: (answer: string) => void;
  userAnswer: string;
  onQuit: () => void;
  onQuestionUpdate?: (updatedQuestion: Question) => void;
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
  onQuestionUpdate,
}) => {
  const [showFeedback, setShowFeedback] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<Question>(questionData);
  const { user } = useAuth();
  const isMobile = useIsMobile();

  useEffect(() => {
    setSelectedAnswer('');
    setShowFeedback(false);
    setCurrentQuestion(questionData);
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
    setIsEditModalOpen(false);
    if (onQuestionUpdate) {
      onQuestionUpdate(updatedQuestion);
    }
  };

  const handleMarkUnclear = async () => {
    try {
      const { error } = await supabase
        .from('questions')
        .update({
          is_unclear: true,
          marked_unclear_at: new Date().toISOString(),
        })
        .eq('id', currentQuestion.id);

      if (error) throw error;

      toast.success('Frage als unklar markiert');
      setCurrentQuestion({
        ...currentQuestion,
        is_unclear: true,
        marked_unclear_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error marking question as unclear:', error);
      toast.error('Fehler beim Markieren der Frage');
    }
  };

  if (!currentQuestion) {
    return <div>Loading question...</div>;
  }

  return (
    <div className={`w-full max-w-2xl mx-auto ${isMobile ? 'px-2' : ''}`}>
      <div className="flex justify-between items-center mb-4">
        <div className="text-sm text-gray-500">
          Frage {currentIndex + 1} von {totalQuestions}
        </div>
        <Button variant="outline" size="sm" onClick={onQuit}>
          Beenden
        </Button>
      </div>

      <Card className={`${isMobile ? 'p-3' : 'p-6'}`}>
        <div className={`flex flex-col sm:flex-row sm:items-stretch gap-3 mb-4`}>
          <div className="flex-grow">
            <DifficultyControls
              questionId={currentQuestion.id}
              difficulty={currentQuestion.difficulty || 3}
              onEditClick={() => setIsEditModalOpen(true)}
            />
          </div>
          <div className="flex justify-end">
            <Button
              variant="outline"
              size={isMobile ? "sm" : "default"}
              onClick={handleMarkUnclear}
              className="flex items-center gap-2 hover:bg-gray-100"
              disabled={currentQuestion.is_unclear}
            >
              <AlertCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Unklar</span>
              <span className="sm:hidden">?!</span>
            </Button>
          </div>
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

        <QuestionFeedback
          showFeedback={showFeedback}
          userAnswer={userAnswer}
          correctAnswer={currentQuestion.correctAnswer}
          comment={currentQuestion.comment}
        />
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
