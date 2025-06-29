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
      <Alert className={`${
        isCorrect 
          ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
          : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
      }`}>
        <AlertDescription className="text-gray-800 dark:text-gray-200">
          <div className="space-y-2">
            <div>
              <span className="font-medium">Protokollierte Antwort: </span>
              <span className="font-bold">{correctAnswer}</span>
            </div>
            {comment && (
              <div>
                <span className="font-medium">Kommentar: </span>
                {comment}
              </div>
            )}
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default FeedbackDisplay;
