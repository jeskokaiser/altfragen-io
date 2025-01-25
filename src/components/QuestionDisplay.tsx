import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Question } from '@/types/Question';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, XCircle } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

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

  const isCorrect = userAnswer === questionData.correctAnswer;

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="mb-8">
        <div className="w-full bg-slate-200 h-2 rounded-full">
          <div
            className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / totalQuestions) * 100}%` }}
          />
        </div>
        <p className="text-right text-sm text-slate-600 mt-2">
          Frage {currentIndex + 1} von {totalQuestions}
        </p>
      </div>

      <Card className="p-6">
        <h3 className="text-xl font-semibold mb-6 text-slate-800">{questionData.question}</h3>
        <div className="space-y-4">
          <RadioGroup value={selectedAnswer} onValueChange={handleAnswerChange}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="A" id="A" />
              <Label htmlFor="A" className="flex items-center">
                <span className="font-semibold mr-2">A)</span> {questionData.optionA}
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="B" id="B" />
              <Label htmlFor="B" className="flex items-center">
                <span className="font-semibold mr-2">B)</span> {questionData.optionB}
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="C" id="C" />
              <Label htmlFor="C" className="flex items-center">
                <span className="font-semibold mr-2">C)</span> {questionData.optionC}
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="D" id="D" />
              <Label htmlFor="D" className="flex items-center">
                <span className="font-semibold mr-2">D)</span> {questionData.optionD}
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="E" id="E" />
              <Label htmlFor="E" className="flex items-center">
                <span className="font-semibold mr-2">E)</span> {questionData.optionE}
              </Label>
            </div>
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
          <div className="mt-6 space-y-4">
            <Alert variant={isCorrect ? "default" : "destructive"} className="flex items-center">
              <div className="mr-2">
                {isCorrect ? <CheckCircle2 className="text-green-500" /> : <XCircle className="text-red-500" />}
              </div>
              <AlertDescription>
                {isCorrect ? "Richtig!" : "Falsch!"} Die korrekte Antwort ist: {questionData.correctAnswer}
              </AlertDescription>
            </Alert>
            {questionData.comment && (
              <Alert>
                <AlertDescription>
                  {questionData.comment}
                </AlertDescription>
              </Alert>
            )}
          </div>
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