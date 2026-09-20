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
    <div className="flex flex-col gap-3 mb-4">
      <ProgressBar currentIndex={currentIndex} totalQuestions={totalQuestions} />
      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          onClick={onQuit}
          className={`text-orange-500 hover:text-orange-600 hover:bg-orange-50 ${isMobile ? 'text-sm' : ''}`}
          size={isMobile ? 'sm' : 'default'}
        >
          Session unterbrechen
        </Button>
      </div>
    </div>
  );
};

export default QuestionHeader;
