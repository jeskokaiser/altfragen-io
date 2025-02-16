
import React, { useState } from 'react';
import { Question } from '@/types/Question';
import { useAuth } from '@/contexts/AuthContext';
import QuestionHeader from './QuestionHeader';
import NavigationButtons from '../training/NavigationButtons';
import EditQuestionModal from '../training/EditQuestionModal';
import QuestionContainer from './QuestionContainer';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';

interface QuestionViewProps {
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

const QuestionView: React.FC<QuestionViewProps> = ({
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
  const [showSolution, setShowSolution] = useState(false);
  const { user } = useAuth();
  const isMobile = useIsMobile();

  React.useEffect(() => {
    // Only reset states when the question actually changes
    if (currentQuestion.id !== questionData.id) {
      setSelectedAnswer('');
      setShowFeedback(false);
      setCurrentQuestion(questionData);
      setIsCorrect(false);
      setWrongAnswers([]);
      setShowSolution(false);
    }
  }, [questionData, currentQuestion.id]);

  const handleAnswerChange = (answer: string) => {
    setSelectedAnswer(answer);
  };

  const handleAnswerSubmitted = (answer: string, correct: boolean, showSol?: boolean) => {
    onAnswer(answer);
    setShowFeedback(true);
    setIsCorrect(correct);
    if (showSol !== undefined) {
      setShowSolution(showSol);
    }
    
    if (!correct) {
      setWrongAnswers(prev => [...prev, answer]);
    }
  };

  const handleNext = () => {
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
      <QuestionHeader
        currentIndex={currentIndex}
        totalQuestions={totalQuestions}
        onQuit={onQuit}
      />

      <QuestionContainer
        question={currentQuestion}
        showFeedback={showFeedback}
        selectedAnswer={selectedAnswer}
        onAnswerChange={handleAnswerChange}
        userAnswer={userAnswer}
        isCorrect={isCorrect}
        wrongAnswers={wrongAnswers}
        user={user}
        onAnswerSubmitted={handleAnswerSubmitted}
        onEditClick={() => setIsEditModalOpen(true)}
        onMarkUnclear={handleMarkUnclear}
      />

      <NavigationButtons
        onPrevious={onPrevious}
        onNext={handleNext}
        isFirstQuestion={currentIndex === 0}
        isLastQuestion={currentIndex === totalQuestions - 1}
        hasUserAnswer={!!userAnswer && isCorrect}
        wrongAttempts={wrongAnswers.length}
        showSolution={showSolution}
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

export default QuestionView;
