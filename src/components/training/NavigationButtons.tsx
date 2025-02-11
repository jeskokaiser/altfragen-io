
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
    <div className={`flex justify-between mt-4 ${isMobile ? 'flex-col gap-3' : ''}`}>
      <Button
        variant="outline"
        onClick={onPrevious}
        disabled={isFirstQuestion}
        className={isMobile ? 'w-full' : ''}
      >
        Zurück
      </Button>
      <Button
        onClick={onNext}
        disabled={!hasUserAnswer}
        className={isMobile ? 'w-full' : ''}
      >
        {isLastQuestion ? 'Fertig' : 'Weiter'}
      </Button>
    </div>
  );
};

export default NavigationButtons;
