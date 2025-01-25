import React from 'react';
import { Button } from '@/components/ui/button';

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
  return (
    <div className="flex justify-between mt-6">
      <Button
        variant="outline"
        onClick={onPrevious}
        disabled={isFirstQuestion}
      >
        Zurück
      </Button>
      <Button
        onClick={onNext}
        disabled={!hasUserAnswer}
      >
        {isLastQuestion ? 'Fertig' : 'Weiter'}
      </Button>
    </div>
  );
};

export default NavigationButtons;