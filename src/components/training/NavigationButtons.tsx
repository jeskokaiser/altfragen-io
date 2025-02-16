
import React from 'react';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';

interface NavigationButtonsProps {
  onPrevious: () => void;
  onNext: () => void;
  isFirstQuestion: boolean;
  isLastQuestion: boolean;
  hasUserAnswer: boolean;
  wrongAttempts: number;
  showSolution?: boolean;
}

const NavigationButtons: React.FC<NavigationButtonsProps> = ({
  onPrevious,
  onNext,
  isFirstQuestion,
  isLastQuestion,
  hasUserAnswer,
  wrongAttempts,
  showSolution = false,
}) => {
  const isMobile = useIsMobile();

  // Allow next if either:
  // 1. Answer is correct OR
  // 2. User has tried all wrong answers OR
  // 3. User has clicked "Lösung anzeigen"
  const canProceed = hasUserAnswer || wrongAttempts >= 4 || showSolution;

  return (
    <div className="flex justify-between mt-4 gap-3">
      <Button
        variant="outline"
        onClick={onPrevious}
        disabled={isFirstQuestion}
        className={`flex-1 ${isMobile ? 'max-w-[160px]' : ''}`}
      >
        Zurück
      </Button>
      <Button
        onClick={onNext}
        disabled={!canProceed}
        className={`flex-1 ${isMobile ? 'max-w-[160px]' : ''}`}
      >
        {isLastQuestion ? 'Fertig' : 'Weiter'}
      </Button>
    </div>
  );
};

export default NavigationButtons;
