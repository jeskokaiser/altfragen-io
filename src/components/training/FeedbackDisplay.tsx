
import React from 'react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, XCircle } from "lucide-react";
import AICommentarySection from './AICommentarySection';

interface FeedbackDisplayProps {
  isCorrect: boolean;
  correctAnswer: string;
  comment?: string;
  questionId?: string;
}

const FeedbackDisplay: React.FC<FeedbackDisplayProps> = ({ 
  isCorrect, 
  correctAnswer, 
  comment, 
  questionId 
}) => {
  return (
    <div className="mt-6 space-y-4">
      <Alert variant={isCorrect ? "default" : "destructive"} className="flex items-center">
        <div className="mr-2">
          {isCorrect ? <CheckCircle2 className="text-green-500" /> : <XCircle className="text-red-500" />}
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
      
      {/* Add AI Commentary Section */}
      {questionId && <AICommentarySection questionId={questionId} />}
    </div>
  );
};

export default FeedbackDisplay;
