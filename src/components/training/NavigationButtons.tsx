
import React from 'react';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';

interface NavigationButtonsProps {
  onPrevious: () => void;
  onNext: () => void;
  isFirstQuestion: boolean;
  isLastQuestion: boolean;
  hasUserAnswer: boolean;
}

const NavigationButtons: React.FC<NavigationButtonsProps> = ({
  onPrevious,
  onNext,
  isFirstQuestion,
  isLastQuestion,
  hasUserAnswer,
}) => {
  const isMobile = useIsMobile();

  return (
    <div className="flex justify-between mt-4 gap-3 bg-white rounded-lg p-4">
      <Button
        variant="outline"
        onClick={onPrevious}
        disabled={isFirstQuestion}
        className={`flex-1 ${isMobile ? 'max-w-[160px]' : ''} hover:bg-slate-50`}
      >
        Zurück
      </Button>
      <Button
        onClick={onNext}
        disabled={!hasUserAnswer}
        className={`flex-1 ${isMobile ? 'max-w-[160px]' : ''} bg-indigo-600 hover:bg-indigo-700`}
      >
        {isLastQuestion ? 'Fertig' : 'Weiter'}
      </Button>
    </div>
  );
};

export default NavigationButtons;
