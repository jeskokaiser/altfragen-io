
import React, { useState } from 'react';
import { Question } from '@/types/Question';
import { AnswerState } from '@/types/Answer';
import { useAuth } from '@/contexts/AuthContext';
import QuestionHeader from './QuestionHeader';
import NavigationButtons from '../training/NavigationButtons';
import EditQuestionModal from '../training/EditQuestionModal';
import QuestionContainer from './QuestionContainer';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';
import { useUnclearQuestions } from '@/hooks/useUnclearQuestions';

interface QuestionViewProps {
  questionData: Question;
  totalQuestions: number;
  currentIndex: number;
  onNext: () => void;
  onPrevious: () => void;
  onAnswer: (answer: string, isFirstAttempt: boolean, viewedSolution: boolean) => void;
  userAnswer: AnswerState;
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
  const { toggleUnclear } = useUnclearQuestions(currentQuestion.id);

  React.useEffect(() => {
    setSelectedAnswer('');
    setShowFeedback(false);
    setCurrentQuestion(questionData);
    setIsCorrect(false);
    setWrongAnswers([]);
    setShowSolution(false);
  }, [questionData]);

  const handleAnswerChange = (answer: string) => {
    setSelectedAnswer(answer);
  };

  const handleAnswerSubmitted = (answer: string, correct: boolean, showSol?: boolean) => {
    onAnswer(answer, wrongAnswers.length === 0, showSol || false);
    setShowFeedback(true);
    setIsCorrect(correct);
    
    if (showSol !== undefined) {
      setShowSolution(showSol);
    }
    
    if (!correct && answer !== 'solution_viewed') {
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
      await toggleUnclear();
      toast.success('Frage als unklar markiert');
    } catch (error) {
      console.error('Error marking question as unclear:', error);
      toast.error('Fehler beim Markieren der Frage');
    }
  };

  // Check if user can edit the question - user owns the question or it's shared with their university
  const canEditQuestion = user && (
    user.id === currentQuestion.user_id || 
    (user.user_metadata?.university_id === currentQuestion.university_id && 
     currentQuestion.visibility === 'university')
  );

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
        userAnswer={userAnswer?.value}
        isCorrect={isCorrect}
        wrongAnswers={wrongAnswers}
        user={user}
        onAnswerSubmitted={handleAnswerSubmitted}
        onEditClick={canEditQuestion ? () => setIsEditModalOpen(true) : undefined}
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

      {canEditQuestion && (
        <EditQuestionModal
          question={currentQuestion}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onQuestionUpdated={handleQuestionUpdate}
        />
      )}
    </div>
  );
};

export default QuestionView;
