import { useEffect, useCallback } from 'react';
import { KeyboardBindings } from '@/contexts/UserPreferencesContext';

export interface TrainingKeyboardActions {
  onAnswerSelect: (answer: string) => void;
  onConfirmAnswer: () => void | Promise<void>;
  onNextQuestion: () => void;
  onShowSolution: () => void;
  canConfirm: boolean;
  canNavigate: boolean;
  canShowSolution: boolean;
}

export const useTrainingKeyboard = (
  keyboardBindings: KeyboardBindings,
  actions: TrainingKeyboardActions,
  isEnabled: boolean = true
) => {
  const handleKeyPress = useCallback(
    (event: KeyboardEvent) => {
      // Don't handle keyboard shortcuts if disabled or if user is typing in an input
      if (!isEnabled || 
          event.target instanceof HTMLInputElement || 
          event.target instanceof HTMLTextAreaElement ||
          event.target instanceof HTMLSelectElement) {
        return;
      }

      const key = event.key;
      const { keyboardBindings: bindings } = { keyboardBindings };

      // Prevent default for our handled keys
      const shouldPreventDefault = 
        key === bindings.answerA ||
        key === bindings.answerB ||
        key === bindings.answerC ||
        key === bindings.answerD ||
        key === bindings.answerE ||
        key === bindings.confirmAnswer ||
        key === bindings.nextQuestion ||
        key === bindings.showSolution;

      if (shouldPreventDefault) {
        event.preventDefault();
      }

      // Handle answer selection (1-5 by default)
      if (key === bindings.answerA) {
        actions.onAnswerSelect('A');
      } else if (key === bindings.answerB) {
        actions.onAnswerSelect('B');
      } else if (key === bindings.answerC) {
        actions.onAnswerSelect('C');
      } else if (key === bindings.answerD) {
        actions.onAnswerSelect('D');
      } else if (key === bindings.answerE) {
        actions.onAnswerSelect('E');
      }
      // Handle confirm/continue (spacebar by default)
      else if (key === bindings.confirmAnswer || key === bindings.nextQuestion) {
        if (actions.canNavigate) {
          actions.onNextQuestion();
        } else if (actions.canConfirm) {
          // Handle both sync and async onConfirmAnswer
          const result = actions.onConfirmAnswer();
          if (result instanceof Promise) {
            result.catch(console.error);
          }
        }
      }
      // Handle show solution ('s' key by default)
      else if (key === bindings.showSolution && actions.canShowSolution) {
        actions.onShowSolution();
      }
    },
    [keyboardBindings, actions, isEnabled]
  );

  useEffect(() => {
    if (!isEnabled) return;

    document.addEventListener('keydown', handleKeyPress);
    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [handleKeyPress, isEnabled]);
};

// Helper function to get visual key display for UI
export const getKeyDisplayName = (key: string): string => {
  switch (key) {
    case ' ':
      return 'Leertaste';
    case 'Enter':
      return 'Enter';
    case 'Escape':
      return 'Escape';
    case 'ArrowUp':
      return '↑';
    case 'ArrowDown':
      return '↓';
    case 'ArrowLeft':
      return '←';
    case 'ArrowRight':
      return '→';
    default:
      return key.toUpperCase();
  }
}; 