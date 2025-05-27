
import React from 'react';
import { Alert, AlertDescription } from "@/components/ui/alert";

interface FeedbackDisplayProps {
  isCorrect: boolean;
  correctAnswer: string;
  comment?: string;
}

const FeedbackDisplay: React.FC<FeedbackDisplayProps> = ({ isCorrect, correctAnswer, comment }) => {
  return (
    <div className="mt-6 space-y-4">
      {comment && (
        <Alert>
          <AlertDescription>{comment}</AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default FeedbackDisplay;
