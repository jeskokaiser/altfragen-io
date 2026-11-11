import { useEffect, useCallback } from 'react';
import { KeyboardBindings } from '@/contexts/UserPreferencesContext';

export interface TrainingKeyboardActions {
  onAnswerSelect: (answer: string) => void;
  onConfirmAnswer: () => void | Promise<void>;
  onNextQuestion: () => void;
  onShowSolution: () => void;
  onToggleChatGPT: () => void;
  onToggleGemini: () => void;
  onDifficultyChange: (difficulty: number) => void;
  onToggleComments?: () => void;
  canConfirm: boolean;
  canNavigate: boolean;
  canShowSolution: boolean;
}

type ShortcutEvent = Pick<KeyboardEvent, 'key' | 'ctrlKey' | 'metaKey' | 'altKey'> & {
  target: EventTarget | { closest(selector: string): unknown } | null;
};

/** When a key press is not a training shortcut. Exported for the spec. */
export const isShortcutBlocked = (event: ShortcutEvent): boolean => {
  // Ctrl/Cmd/Alt combinations always belong to the browser (copy, paste, tabs).
  if (event.ctrlKey || event.metaKey || event.altKey) return true;
  const target =
    event.target && 'closest' in event.target
      ? (event.target as { closest(selector: string): unknown })
      : null;
  if (!target) return false;
  // Never while typing, or while a menu, listbox or dialog has focus.
  if (
    target.closest(
      'input, textarea, select, [contenteditable]:not([contenteditable="false"]), [role="menu"], [role="listbox"], [role="dialog"], [role="alertdialog"]',
    )
  ) {
    return true;
  }
  // Space and Enter on a focused button or link do what that control says; answer rows are
  // the exception, so Space still confirms and moves on after an answer was clicked.
  return (
    (event.key === ' ' || event.key === 'Enter') &&
    Boolean(target.closest('button, a[href]')) &&
    !target.closest('[data-training-answer]')
  );
};

export const useTrainingKeyboard = (
  keyboardBindings: KeyboardBindings,
  actions: TrainingKeyboardActions,
  isEnabled: boolean = true,
) => {
  const handleKeyPress = useCallback(
    (event: KeyboardEvent) => {
      if (!isEnabled || isShortcutBlocked(event)) return;

      const key = event.key;
      const { keyboardBindings: bindings } = { keyboardBindings };

      // Shift is the only modifier shortcuts use (Shift+1-5 sets the difficulty).
      const modifierKey = event.shiftKey ? 'Shift+' : '';
      const keyWithModifier = modifierKey ? `${modifierKey}${key}` : key;

      // Prevent default for our handled keys
      const shouldPreventDefault =
        key === bindings.answerA ||
        key === bindings.answerB ||
        key === bindings.answerC ||
        key === bindings.answerD ||
        key === bindings.answerE ||
        key === bindings.confirmAnswer ||
        key === bindings.nextQuestion ||
        key === bindings.showSolution ||
        key === bindings.toggleChatGPT ||
        key === bindings.toggleGemini ||
        (!event.shiftKey && key === 'k' && Boolean(actions.onToggleComments)) ||
        keyWithModifier === bindings.difficulty1 ||
        keyWithModifier === bindings.difficulty2 ||
        keyWithModifier === bindings.difficulty3 ||
        keyWithModifier === bindings.difficulty4 ||
        keyWithModifier === bindings.difficulty5;

      if (shouldPreventDefault) {
        event.preventDefault();
      }

      // Handle difficulty changes FIRST (Shift+1-5 by default)
      // This must be checked before answer selection to avoid conflicts
      if (keyWithModifier === bindings.difficulty1) {
        actions.onDifficultyChange(1);
      } else if (keyWithModifier === bindings.difficulty2) {
        actions.onDifficultyChange(2);
      } else if (keyWithModifier === bindings.difficulty3) {
        actions.onDifficultyChange(3);
      } else if (keyWithModifier === bindings.difficulty4) {
        actions.onDifficultyChange(4);
      } else if (keyWithModifier === bindings.difficulty5) {
        actions.onDifficultyChange(5);
      }
      // Handle answer selection (1-5 by default) - only if no modifier is pressed
      else if (!modifierKey && key === bindings.answerA) {
        actions.onAnswerSelect('A');
      } else if (!modifierKey && key === bindings.answerB) {
        actions.onAnswerSelect('B');
      } else if (!modifierKey && key === bindings.answerC) {
        actions.onAnswerSelect('C');
      } else if (!modifierKey && key === bindings.answerD) {
        actions.onAnswerSelect('D');
      } else if (!modifierKey && key === bindings.answerE) {
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
      // K opens and closes the comments (fixed, not rebindable)
      else if (!modifierKey && key === 'k' && actions.onToggleComments) {
        actions.onToggleComments();
      }
      // Handle toggle ChatGPT ('c' key by default)
      else if (key === bindings.toggleChatGPT) {
        actions.onToggleChatGPT();
      }
      // Handle toggle Gemini ('g' key by default)
      else if (key === bindings.toggleGemini) {
        actions.onToggleGemini();
      }
    },
    [keyboardBindings, actions, isEnabled],
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
