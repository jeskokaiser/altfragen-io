import React from 'react';
import { Button } from '@/components/ui/button';
import ProgressBar from '@/components/training/ProgressBar';
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
    <div className="flex flex-col gap-3 mb-4">
      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          onClick={onQuit}
          className={`text-red-500 hover:text-red-600 hover:bg-red-50 ${isMobile ? 'text-sm' : ''}`}
          size={isMobile ? 'sm' : 'default'}
        >
          Training beenden
        </Button>
      </div>
      <ProgressBar currentIndex={currentIndex} totalQuestions={totalQuestions} />
    </div>
  );
};

export default QuestionHeader;
