import React from 'react';
import { Button } from '@/components/ui/button';
import ProgressBar from './ProgressBar';

interface QuestionHeaderProps {
  currentIndex: number;
  totalQuestions: number;
  onQuit: () => void;
}

const QuestionHeader: React.FC<QuestionHeaderProps> = ({
  currentIndex,
  totalQuestions,
  onQuit,
}) => {
  return (
    <div className="flex justify-between items-center mb-4">
      <ProgressBar currentIndex={currentIndex} totalQuestions={totalQuestions} />
      <Button 
        variant="outline" 
        onClick={onQuit} 
        className="text-red-500 hover:text-red-600 hover:bg-red-50"
      >
        Training beenden
      </Button>
    </div>
  );
};

export default QuestionHeader;