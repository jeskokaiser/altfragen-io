import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { RadioGroup } from "@/components/ui/radio-group";
import { Question } from '@/types/Question';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import ProgressBar from './training/ProgressBar';
import AnswerOption from './training/AnswerOption';
import FeedbackDisplay from './training/FeedbackDisplay';

interface QuestionDisplayProps {
  questionData: Question;
  totalQuestions: number;
  currentIndex: number;
  onNext: () => void;
  onPrevious: () => void;
  onAnswer: (answer: string) => void;
  userAnswer: string;
}

const QuestionDisplay: React.FC<QuestionDisplayProps> = ({
  questionData,
  totalQuestions,
  currentIndex,
  onNext,
  onPrevious,
  onAnswer,
  userAnswer,
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
          is_correct: selectedAnswer === questionData.correctAnswer
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
      <ProgressBar currentIndex={currentIndex} totalQuestions={totalQuestions} />

      <Card className="p-6">
        <h3 className="text-xl font-semibold mb-6 text-slate-800">{questionData.question}</h3>
        <div className="space-y-4">
          <RadioGroup value={selectedAnswer} onValueChange={handleAnswerChange}>
            <AnswerOption value="A" text={questionData.optionA} />
            <AnswerOption value="B" text={questionData.optionB} />
            <AnswerOption value="C" text={questionData.optionC} />
            <AnswerOption value="D" text={questionData.optionD} />
            <AnswerOption value="E" text={questionData.optionE} />
          </RadioGroup>

          <div className="mt-4">
            <Button 
              onClick={handleConfirmAnswer}
              disabled={!selectedAnswer || showFeedback}
              className="w-full"
            >
              Antwort bestätigen
            </Button>
          </div>
        </div>

        {showFeedback && userAnswer && (
          <FeedbackDisplay 
            isCorrect={userAnswer === questionData.correctAnswer}
            correctAnswer={questionData.correctAnswer}
            comment={questionData.comment}
          />
        )}
      </Card>

      <div className="flex justify-between mt-6">
        <Button
          variant="outline"
          onClick={onPrevious}
          disabled={currentIndex === 0}
        >
          Zurück
        </Button>
        <Button
          onClick={handleNext}
          disabled={!userAnswer}
        >
          {currentIndex === totalQuestions - 1 ? 'Fertig' : 'Weiter'}
        </Button>
      </div>
    </div>
  );
};

export default QuestionDisplay;