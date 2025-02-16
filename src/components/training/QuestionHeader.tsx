
import React from 'react';
import { Button } from '@/components/ui/button';
import ProgressBar from './ProgressBar';
import { useIsMobile } from '@/hooks/use-mobile';

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
  const isMobile = useIsMobile();

  return (
    <div className="bg-white rounded-lg p-4 mb-4 space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-slate-800">Training</h2>
        <Button 
          variant="outline" 
          onClick={onQuit} 
          className="text-red-500 hover:text-red-600 hover:bg-red-50"
          size={isMobile ? "sm" : "default"}
        >
          Training beenden
        </Button>
      </div>
      <ProgressBar currentIndex={currentIndex} totalQuestions={totalQuestions} />
    </div>
  );
};

export default QuestionHeader;
