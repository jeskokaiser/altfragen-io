
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Question } from '@/types/Question';
import { useAuth } from '@/contexts/AuthContext';
import QuestionHeader from '@/components/features/questions/header/QuestionHeader';
import QuestionContent from '@/components/features/questions/QuestionContent';
import NavigationButtons from '@/components/features/questions/navigation/NavigationButtons';
import { EditQuestionModal } from '@/components/features';
import AnswerSubmission from '@/components/features/questions/submission/AnswerSubmission';
import DifficultyControls from '@/components/features/training/DifficultyControls';
import QuestionFeedback from '@/components/features/questions/feedback/QuestionFeedback';
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
  const [isCorrect, setIsCorrect] = useState(false);
  const [wrongAnswers, setWrongAnswers] = useState<string[]>([]);
  const { user } = useAuth();
  const isMobile = useIsMobile();

  useEffect(() => {
    setSelectedAnswer('');
    setShowFeedback(false);
    setCurrentQuestion(questionData);
    setIsCorrect(false);
    setWrongAnswers([]);
  }, [questionData]);

  const handleAnswerChange = (answer: string) => {
    setSelectedAnswer(answer);
  };

  const handleAnswerSubmitted = (answer: string, correct: boolean) => {
    onAnswer(answer);
    setShowFeedback(true);
    setIsCorrect(correct);
    
    if (!correct) {
      setWrongAnswers(prev => [...prev, answer]);
    }
    
    if (correct) {
      // Only allow proceeding to next question when the answer is correct
      setTimeout(() => {
        handleNext();
      }, 1500);
    }
  };

  const handleNext = () => {
    setShowFeedback(false);
    setSelectedAnswer('');
    setIsCorrect(false);
    setWrongAnswers([]);
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

      toast.info('Frage als unklar markiert');
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
      <QuestionHeader
        currentIndex={currentIndex}
        totalQuestions={totalQuestions}
        onQuit={onQuit}
      />

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
          wrongAnswers={wrongAnswers}
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
          isCorrect={isCorrect}
          wrongAnswers={wrongAnswers}
        />
      </Card>

      <NavigationButtons
        onPrevious={onPrevious}
        onNext={handleNext}
        isFirstQuestion={currentIndex === 0}
        isLastQuestion={currentIndex === totalQuestions - 1}
        hasUserAnswer={!!userAnswer && isCorrect}
        wrongAttempts={wrongAnswers.length}
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
