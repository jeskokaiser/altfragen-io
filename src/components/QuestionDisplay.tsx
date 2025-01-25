import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Question } from '@/types/Question';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Pencil } from 'lucide-react';
import QuestionHeader from './training/QuestionHeader';
import QuestionContent from './training/QuestionContent';
import FeedbackDisplay from './training/FeedbackDisplay';
import NavigationButtons from './training/NavigationButtons';
import EditQuestionModal from './training/EditQuestionModal';
import AnswerSubmission from './training/AnswerSubmission';
import { Badge } from '@/components/ui/badge';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
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
  const [currentQuestion, setCurrentQuestion] = useState<Question>(questionData);
  const { user } = useAuth();

  useEffect(() => {
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
  };

  const handleDifficultyChange = async (value: string) => {
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

  const getDifficultyColor = (difficulty: number) => {
    switch (difficulty) {
      case 1: return 'bg-green-100 text-green-800';
      case 2: return 'bg-blue-100 text-blue-800';
      case 3: return 'bg-yellow-100 text-yellow-800';
      case 4: return 'bg-orange-100 text-orange-800';
      case 5: return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDifficultyLabel = (difficulty: number) => {
    switch (difficulty) {
      case 1: return 'Sehr leicht';
      case 2: return 'Leicht';
      case 3: return 'Mittel';
      case 4: return 'Schwer';
      case 5: return 'Sehr schwer';
      default: return 'Unbekannt';
    }
  };

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
            <Badge className={`${getDifficultyColor(currentQuestion.difficulty)}`}>
              Schwierigkeit: {currentQuestion.difficulty}
            </Badge>
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
          
          <ToggleGroup 
            type="single" 
            value={currentQuestion.difficulty.toString()}
            onValueChange={handleDifficultyChange}
            className="justify-start"
          >
            {[1, 2, 3, 4, 5].map((level) => (
              <ToggleGroupItem 
                key={level} 
                value={level.toString()}
                aria-label={`Schwierigkeitsgrad ${level}`}
                className={`${getDifficultyColor(level)} hover:opacity-90`}
              >
                {level}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
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