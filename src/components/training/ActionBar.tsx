import React from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Kbd } from '@/components/ds/Kbd';
import { useUserPreferences } from '@/contexts/UserPreferencesContext';
import { getKeyDisplayName } from '@/hooks/useTrainingKeyboard';

interface ActionBarProps {
  onPrevious: () => void;
  onNext: () => void;
  isFirstQuestion: boolean;
  isLastQuestion: boolean;
  hasUserAnswer: boolean;
  wrongAttempts: number;
  showSolution?: boolean;
  /** Shown between "Zurück" and "Weiter" until the answer is revealed. */
  onShowSolution?: () => void;
}

/**
 * Zurück · Lösung anzeigen · Weiter. On phones it stays fixed at the bottom, within thumb reach;
 * the page reserves room for it (pb-28) so it never covers focused content.
 */
const ActionBar: React.FC<ActionBarProps> = ({
  onPrevious,
  onNext,
  isFirstQuestion,
  isLastQuestion,
  hasUserAnswer,
  wrongAttempts,
  showSolution = false,
  onShowSolution,
}) => {
  const { preferences } = useUserPreferences();
  const bindings = preferences.keyboardBindings;

  // Next is allowed once the answer is right, all wrong options were tried, or the solution was shown.
  const canProceed = hasUserAnswer || wrongAttempts >= 4 || showSolution;

  return (
    <div className="fixed inset-x-0 bottom-0 z-bar border-t bg-background/95 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 backdrop-blur md:static md:mt-4 md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none">
      <div className="mx-auto flex max-w-reading items-center gap-2">
        <Button
          variant="outline"
          onClick={onPrevious}
          disabled={isFirstQuestion}
          className="flex-1 md:flex-none"
        >
          <ArrowLeft aria-hidden="true" />
          Zurück
        </Button>
        <div className="flex flex-1 justify-center">
          {onShowSolution && (
            <Button variant="ghost" onClick={onShowSolution} className="w-full md:w-auto">
              Lösung anzeigen
              <Kbd aria-hidden="true" className="hidden md:inline-flex">
                {getKeyDisplayName(bindings.showSolution)}
              </Kbd>
            </Button>
          )}
        </div>
        <Button onClick={onNext} disabled={!canProceed} className="flex-1 md:flex-none">
          {isLastQuestion ? 'Fertig' : 'Weiter'}
          {canProceed ? (
            <Kbd
              aria-hidden="true"
              className="hidden border-primary-foreground/30 bg-primary-foreground/15 text-primary-foreground md:inline-flex"
            >
              {getKeyDisplayName(bindings.nextQuestion)}
            </Kbd>
          ) : (
            <ArrowRight aria-hidden="true" />
          )}
        </Button>
      </div>
    </div>
  );
};

export default ActionBar;
