import React from 'react';
import { Button } from '@/components/ui/button';
import ProgressBar from '../training/ProgressBar';
import { useIsMobile } from '@/hooks/use-mobile';
import { QuestionHeaderProps } from '@/types/question';

const QuestionHeader: React.FC<QuestionHeaderProps> = ({
  currentIndex,
  totalQuestions,
  onQuit,
}) => {
  const isMobile = useIsMobile();

  return (
    <div className="flex flex-col gap-3 mb-4">
      <ProgressBar currentIndex={currentIndex} totalQuestions={totalQuestions} />
      <div className="flex justify-end">
        <Button 
          variant="outline" 
          onClick={onQuit} 
          className={`text-red-500 hover:text-red-600 hover:bg-red-50 ${isMobile ? 'text-sm' : ''}`}
          size={isMobile ? "sm" : "default"}
        >
          Training beenden
        </Button>
      </div>
    </div>
  );
};

export default QuestionHeader;
