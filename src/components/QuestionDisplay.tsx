import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Question } from '@/types/Question';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import QuestionHeader from './training/QuestionHeader';
import QuestionContent from './training/QuestionContent';
import FeedbackDisplay from './training/FeedbackDisplay';
import NavigationButtons from './training/NavigationButtons';

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
  const { user } = useAuth();

  const handleAnswerChange = (answer: string) => {
    setSelectedAnswer(answer);
  };

  const handleConfirmAnswer = async () => {
    if (selectedAnswer) {
      onAnswer(selectedAnswer);
      setShowFeedback(true);

      try {
        const { error } = await supabase.from('user_progress').insert({
          user_id: user?.id,
          question_id: questionData.id,
          user_answer: selectedAnswer,
          is_correct: selectedAnswer.toLowerCase() === questionData.correctAnswer.toLowerCase()
        });

        if (error) throw error;
      } catch (error: any) {
        console.error('Error saving progress:', error);
        toast.error("Fehler beim Speichern des Fortschritts");
      }
    }
  };

  const handleNext = () => {
    setShowFeedback(false);
    setSelectedAnswer('');
    onNext();
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <QuestionHeader
        currentIndex={currentIndex}
        totalQuestions={totalQuestions}
        onQuit={onQuit}
      />

      <Card className="p-6">
        <QuestionContent
          questionData={questionData}
          selectedAnswer={selectedAnswer}
          onAnswerChange={handleAnswerChange}
          onConfirmAnswer={handleConfirmAnswer}
          showFeedback={showFeedback}
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
    </div>
  );
};

export default QuestionDisplay;