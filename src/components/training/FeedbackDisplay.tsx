import React from 'react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, XCircle } from "lucide-react";

interface FeedbackDisplayProps {
  isCorrect: boolean;
  correctAnswer: string;
  comment?: string;
}

const FeedbackDisplay: React.FC<FeedbackDisplayProps> = ({ isCorrect, correctAnswer, comment }) => {
  return (
    <div className="mt-6 space-y-4">
      <Alert variant={isCorrect ? "default" : "destructive"} className="flex items-center">
        <div className="mr-2">
          {isCorrect ? <CheckCircle2 className="text-green-500 dark:text-white" /> : <XCircle className="text-red-500 dark:text-white" />}
        </div>
        <AlertDescription>
          {isCorrect ? "Richtig!" : "Falsch!"} Die korrekte Antwort ist: {correctAnswer}
        </AlertDescription>
      </Alert>
      {comment && (
        <Alert>
          <AlertDescription>{comment}</AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default FeedbackDisplay;