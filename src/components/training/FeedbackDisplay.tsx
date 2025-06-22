
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
        <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <AlertDescription className="text-gray-800 dark:text-gray-200">{comment}</AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default FeedbackDisplay;
