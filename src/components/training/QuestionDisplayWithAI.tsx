import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Question } from '@/types/Question';
import { AnswerState } from '@/types/Answer';
import { useAuth } from '@/contexts/AuthContext';
import SessionBar from './SessionBar';
import ActionBar from './ActionBar';
import EditQuestionModal from './EditQuestionModal';
import DifficultyControls from './DifficultyControls';
import QuestionImage from '@/components/questions/QuestionImage';
import { Link } from 'react-router-dom';
import { Brain, MoreHorizontal, Pencil, X, Image as ImageIcon } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AIAnswerCommentaryService } from '@/services/AIAnswerCommentaryService';
import { useUserPreferences } from '@/contexts/UserPreferencesContext';
import type { EnhancedAIVersion } from '@/services/UserPreferencesService';
import { useTrainingKeyboard, TrainingKeyboardActions } from '@/hooks/useTrainingKeyboard';
import { AmbossAnswer } from './AmbossAnswer';
import { MultiModelAIComment } from './MultiModelAIComment';
import { GeneralAIComments } from './GeneralAIComments';
import { formatModelConsensus, modelConsensus } from './modelConsensus';
import { ModelIcon, ModelName } from './ModelIcon';
import { AIModelMenuItems, AIModelSelector } from './AIModelSelector';
import { Badge } from '@/components/ui/badge';
import { Callout } from '@/components/ds/Callout';
import { LoadingState } from '@/components/ds/States';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';
import { useUnclearQuestions } from '@/hooks/useUnclearQuestions';
import { usePremiumFeatures } from '@/hooks/usePremiumFeatures';
import CommentsSection from './CommentsSection';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { MessageSquare } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { getCommentsForQuestion } from '@/services/CommentService';
import { recordAnswerAttempt, setUserDifficulty } from '@/services/UserProgressService';

interface QuestionDisplayWithAIProps {
  questionData: Question;
  totalQuestions: number;
  currentIndex: number;
  onNext: () => void;
  onPrevious: () => void;
  onAnswer: (answer: string, isFirstAttempt: boolean, viewedSolution: boolean) => void;
  // Optional: per-session recording; when provided, we call it instead of default save to user_progress
  onSessionRecordAttempt?: (
    answer: string,
    isCorrect: boolean,
    viewedSolution?: boolean,
    isFirstAttempt?: boolean,
  ) => Promise<void>;
  userAnswerState?: AnswerState;
  onQuit: () => void;
  onQuestionUpdate?: (updatedQuestion: Question) => void;
  onQuestionIgnored?: (questionId: string) => void;
}

const QuestionDisplayWithAI: React.FC<QuestionDisplayWithAIProps> = ({
  questionData,
  totalQuestions,
  currentIndex,
  onNext,
  onPrevious,
  onAnswer,
  userAnswerState,
  onQuit,
  onQuestionUpdate,
  onQuestionIgnored,
  onSessionRecordAttempt,
}) => {
  const [showFeedback, setShowFeedback] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<Question>(questionData);
  const [isCorrect, setIsCorrect] = useState(false);
  const [wrongAnswers, setWrongAnswers] = useState<string[]>([]);
  const [firstWrongAnswer, setFirstWrongAnswer] = useState<string | null>(null);
  const [showSolution, setShowSolution] = useState(false);
  const [usageIncrementedForQuestion, setUsageIncrementedForQuestion] = useState<string | null>(
    null,
  );
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [initialAnswer, setInitialAnswer] = useState<string | null>(null);
  const [canShowAIContent, setCanShowAIContent] = useState(false);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(400);
  const [isResizing, setIsResizing] = useState(false);
  const [difficultyUpdateKey, setDifficultyUpdateKey] = useState(0);
  const sidebarRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const panelHeadingRef = useRef<HTMLHeadingElement>(null);
  const commentsTriggerRef = useRef<Element | null>(null);
  // Refs to store toggle functions for each answer option
  // Create individual refs that persist across renders
  const toggleExpandRefA = useRef<(() => void) | null>(null);
  const toggleExpandRefB = useRef<(() => void) | null>(null);
  const toggleExpandRefC = useRef<(() => void) | null>(null);
  const toggleExpandRefD = useRef<(() => void) | null>(null);
  const toggleExpandRefE = useRef<(() => void) | null>(null);

  // Compose refs into an object that persists across renders
  const toggleExpandRefs = useMemo(
    () => ({
      A: toggleExpandRefA,
      B: toggleExpandRefB,
      C: toggleExpandRefC,
      D: toggleExpandRefD,
      E: toggleExpandRefE,
    }),
    [],
  );
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();
  const { preferences, updatePreferences } = useUserPreferences();
  const {
    subscribed,
    remainingFreeViews,
    requirePremiumForAI,
    isFreeTier,
    canAccessAIComments,
    dailyUsage,
    DAILY_LIMIT,
  } = usePremiumFeatures();

  // Fetch AI commentary data
  const { data: aiCommentary, isLoading: aiLoading } = useQuery({
    queryKey: ['ai-commentary', currentQuestion.id],
    queryFn: () => AIAnswerCommentaryService.getCommentaryForQuestion(currentQuestion.id),
    enabled: !!currentQuestion.id,
  });

  const aiConsensus = useMemo(
    () =>
      aiCommentary ? modelConsensus(aiCommentary.models, preferences?.selectedAIModels) : null,
    [aiCommentary, preferences?.selectedAIModels],
  );

  // Fetch comments to show their number in the SessionBar
  const { data: comments } = useQuery({
    queryKey: ['question-comments', currentQuestion.id, user?.id],
    queryFn: () => getCommentsForQuestion(currentQuestion.id),
    enabled: !!currentQuestion.id && !!user?.id,
  });

  // After "Weiter", focus moves to the new question so screen readers start there.
  const previousQuestionId = useRef(questionData.id);
  useEffect(() => {
    if (previousQuestionId.current !== questionData.id) {
      previousQuestionId.current = questionData.id;
      headingRef.current?.focus({ preventScroll: true });
    }
  }, [questionData.id]);

  // The desktop panel takes focus when it opens and hands it back to the trigger when it closes.
  useEffect(() => {
    if (isMobile) return;
    if (isCommentsOpen) {
      commentsTriggerRef.current = document.activeElement;
      panelHeadingRef.current?.focus();
    } else if (commentsTriggerRef.current instanceof HTMLElement) {
      commentsTriggerRef.current.focus();
      commentsTriggerRef.current = null;
    }
  }, [isCommentsOpen, isMobile]);

  // Handle sidebar resizing
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      const newWidth = window.innerWidth - e.clientX;
      // Constrain width between 300px and 800px
      const constrainedWidth = Math.max(300, Math.min(800, newWidth));
      setSidebarWidth(constrainedWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing]);

  useEffect(() => {
    const isNewQuestion = currentQuestion.id !== questionData.id;

    // Reset state when moving to a different question
    if (isNewQuestion) {
      setShowFeedback(false);
      setCurrentQuestion(questionData);
      setIsCorrect(false);
      setShowSolution(false);
      setUsageIncrementedForQuestion(null);
      setWrongAnswers([]);
      setFirstWrongAnswer(null);
      setSelectedAnswer(null);
      setInitialAnswer(null);
      setCanShowAIContent(false);
      setDifficultyUpdateKey(0);
    }

    // Initialize/restore state from userAnswerState if it exists
    // This runs both on first render and when navigating back to a question
    if (userAnswerState?.attempts && userAnswerState.attempts.length > 0) {
      // When restoring state, ignore the special sentinel "solution_viewed" for
      // wrong-attempt tracking so that firstWrongAnswer always refers to a real
      // answer option (A–E) and not the "show solution" action.
      const isRealWrongAttempt = (attempt: string) =>
        attempt !== 'solution_viewed' &&
        attempt.charAt(0).toLowerCase() !== questionData.correctAnswer.charAt(0).toLowerCase();

      const wrongAttempts = userAnswerState.attempts.filter(isRealWrongAttempt);
      const firstWrong = userAnswerState.attempts.find(isRealWrongAttempt);

      const computedIsCorrect =
        userAnswerState.value.charAt(0).toLowerCase() ===
        questionData.correctAnswer.charAt(0).toLowerCase();

      setWrongAnswers(wrongAttempts);
      setFirstWrongAnswer(firstWrong || null);
      setIsCorrect(computedIsCorrect);
      setSelectedAnswer(userAnswerState.value);

      // Set initial answer from user answer state if available
      if (userAnswerState.originalAnswer) {
        setInitialAnswer(userAnswerState.originalAnswer);
      } else if (userAnswerState.attempts.length > 0) {
        setInitialAnswer(userAnswerState.attempts[0]);
      }

      // Only show feedback if:
      // 1. User viewed the solution, OR
      // 2. Answer was correct (user should see they got it right)
      // If user answered incorrectly without viewing solution, don't show feedback yet
      const shouldShowFeedback = userAnswerState.viewedSolution || computedIsCorrect;
      setShowFeedback(shouldShowFeedback);

      // Check if solution was viewed
      if (userAnswerState.viewedSolution) {
        setShowSolution(true);
      } else {
        setShowSolution(false);
      }
    }

    // Update currentQuestion reference if it's a new question
    if (isNewQuestion) {
      setCurrentQuestion(questionData);
    }
  }, [questionData.id, questionData.correctAnswer, userAnswerState]);

  // Sync canShowAIContent with access state and question state
  useEffect(() => {
    if (subscribed) {
      // Premium users can always see AI content
      setCanShowAIContent(true);
    } else if (currentQuestion.id === usageIncrementedForQuestion) {
      // Already incremented for this question - check current access
      // Allow showing AI content even before feedback if usage was incremented
      setCanShowAIContent(canAccessAIComments);
    } else if (!showFeedback) {
      // Don't show AI content if feedback isn't shown and usage hasn't been incremented
      setCanShowAIContent(false);
    } else {
      // Feedback is shown but usage hasn't been incremented - don't show AI content
      setCanShowAIContent(false);
    }
  }, [
    showFeedback,
    subscribed,
    canAccessAIComments,
    currentQuestion.id,
    usageIncrementedForQuestion,
  ]);

  // Database progress saving logic
  // NOTE: Do not rely on component state like wrongAnswers inside this function.
  // All information that affects persistence (e.g. "first attempt") must be passed
  // in via parameters to avoid stale-closure issues.
  const saveAnswerProgress = async (
    answer: string,
    isAnswerCorrect: boolean,
    viewedSolution: boolean = false,
    isFirstAttempt: boolean = false,
  ) => {
    if (onSessionRecordAttempt) {
      // Delegate to session recording when running inside a session
      await onSessionRecordAttempt(answer, isAnswerCorrect, viewedSolution, isFirstAttempt);
      return;
    }
    if (!user) return;

    try {
      await recordAnswerAttempt({
        userId: user.id,
        questionId: currentQuestion.id,
        answer,
        isCorrect: isAnswerCorrect,
        isFirstAttempt,
        immediateFeedback: preferences?.immediateFeedback ?? false,
      });

      // Invalidate dashboard queries to ensure fresh data when user returns
      queryClient.invalidateQueries({ queryKey: ['today-new', user.id] });
      queryClient.invalidateQueries({ queryKey: ['today-practice', user.id] });
      queryClient.invalidateQueries({ queryKey: ['total-answers', user.id] });
      queryClient.invalidateQueries({ queryKey: ['total-attempts', user.id] });
      queryClient.invalidateQueries({ queryKey: ['user-progress', user.id] });
    } catch (error) {
      console.error('Error saving answer progress:', error);
      toast.error('Fehler beim Speichern des Fortschritts');
    }
  };

  const handleAnswerSubmitted = (answer: string, correct: boolean, viewedSolution?: boolean) => {
    const isSolutionViewed = answer === 'solution_viewed';
    // Compute "first attempt" once, based on the state *before* we schedule any updates.
    // This avoids relying on state that may have changed by the time async logic runs.
    const isFirstAttemptFlag = wrongAnswers.length === 0 && !firstWrongAnswer && !isSolutionViewed;

    onAnswer(answer, isFirstAttemptFlag, viewedSolution || false);

    if (!correct) {
      // Don't treat the special "solution_viewed" sentinel as the first wrong answer option.
      // firstWrongAnswer should always refer to a concrete choice (A–E) so that
      // subsequent real attempts still count as "first attempt" when appropriate.
      if (!firstWrongAnswer && !isSolutionViewed) {
        setFirstWrongAnswer(answer);
      }
      // Only track concrete option letters in wrongAnswers; solution_viewed is a separate action
      if (!isSolutionViewed) {
        setWrongAnswers((prev) => [...prev, answer]);
      }
    }

    setShowFeedback(true);
    setIsCorrect(correct);

    // Show solution if:
    // 1. User explicitly viewed solution (viewedSolution === true), OR
    // 2. Answer is correct (user should see the solution)
    if (viewedSolution || correct) {
      setShowSolution(true);
    }
  };

  const handleAnswerClick = async (answer: string) => {
    const answerLetter = answer.charAt(0).toUpperCase() as 'A' | 'B' | 'C' | 'D' | 'E';

    // Check if this answer is already selected or was attempted
    const isAlreadySelected = selectedAnswer?.charAt(0).toUpperCase() === answerLetter;
    const wasAlreadyAttempted = wrongAnswers.includes(answerLetter);
    const isAlreadySelectedOrAttempted = isAlreadySelected || wasAlreadyAttempted;

    // If feedback is already shown, or if answer is already selected/attempted (before feedback),
    // toggle the expansion for this answer
    if (showFeedback || isAlreadySelectedOrAttempted) {
      const toggleFn = toggleExpandRefs[answerLetter].current;
      if (toggleFn) {
        toggleFn();
      }
      // Still update selectedAnswer so the toggle works correctly
      if (!showFeedback) {
        setSelectedAnswer(answer);
      }
      // If feedback is shown, we're done - just toggle
      if (showFeedback) {
        return;
      }
      // If before feedback but already selected/attempted, we still want to process the answer
      // (in case they want to change their answer), but also toggle expansion
      // Actually, wait - if they press the same key again before feedback, they probably want to toggle
      // So let's return here to just toggle
      return;
    }

    const isAnswerCorrect =
      answer.charAt(0).toLowerCase() === currentQuestion.correctAnswer.charAt(0).toLowerCase();
    const isSolutionViewed = answer === 'solution_viewed';
    // Snapshot whether this was the first real attempt *before* scheduling any state updates
    // so we don't depend on potentially stale state inside async callbacks.
    const isFirstAttemptSnapshot =
      wrongAnswers.length === 0 && !firstWrongAnswer && !isSolutionViewed;

    // Track which answer was selected
    setSelectedAnswer(answer);

    // Track initial answer (first click only)
    if (!initialAnswer) {
      setInitialAnswer(answer);
    }

    // For free users, increment AI comment usage on the *first* answer click for this question
    // so that AI comments can open for any selected answer (not only after a correct one).
    if (!subscribed && currentQuestion.id !== usageIncrementedForQuestion) {
      // Check access before incrementing - if they're at the limit, don't increment
      if (canAccessAIComments) {
        let usageSuccess = false;
        await requirePremiumForAI(() => {
          console.log('AI comment usage incremented for selecting answer');
          usageSuccess = true;
        });
        if (usageSuccess) {
          setUsageIncrementedForQuestion(currentQuestion.id);
          // After incrementing, check if they still have access (might have hit limit)
          // The hook state will update, so check it in the next render cycle
          setCanShowAIContent(dailyUsage + 1 < DAILY_LIMIT);
        } else {
          setCanShowAIContent(false);
        }
      } else {
        // No access - don't show AI content
        setCanShowAIContent(false);
      }
    } else if (subscribed) {
      // Premium users can always see AI content
      setCanShowAIContent(true);
    } else if (currentQuestion.id === usageIncrementedForQuestion) {
      // Already incremented for this question - check current access
      setCanShowAIContent(canAccessAIComments);
    } else {
      // Not revealed yet - don't show AI content
      setCanShowAIContent(false);
    }

    // Update UI immediately for instant feedback
    // Note: viewedSolution should only be true when user explicitly clicks "Lösung anzeigen"
    // For correct answers or immediate feedback, we show the solution in UI but don't mark as viewedSolution
    if (preferences?.immediateFeedback || isAnswerCorrect) {
      handleAnswerSubmitted(answer, isAnswerCorrect, false);
    } else {
      // In normal mode with wrong answer: record the attempt but don't reveal yet
      // This allows the user to try again
      if (!firstWrongAnswer) {
        setFirstWrongAnswer(answer);
      }
      setWrongAnswers((prev) => [...prev, answer]);
      onAnswer(answer, isFirstAttemptSnapshot, false);

      // No toast needed - AI comments show immediately
    }

    // Save to database in the background (non-blocking), passing in the
    // precomputed "first attempt" flag so we don't rely on closure state.
    // IMPORTANT: Any caller of saveAnswerProgress must compute isFirstAttempt
    // synchronously before scheduling state updates and pass it explicitly here.
    saveAnswerProgress(answer, isAnswerCorrect, false, isFirstAttemptSnapshot).catch((error) => {
      console.error('Error saving answer progress:', error);
      // Don't show error toast for background saves to avoid disrupting flow
    });
  };

  const handleNext = () => {
    setShowFeedback(false);
    setIsCorrect(false);
    setShowSolution(false);
    setWrongAnswers([]);
    setFirstWrongAnswer(null);
    setSelectedAnswer(null);
    onNext();
  };

  const handleQuestionUpdate = (updatedQuestion: Question) => {
    setCurrentQuestion(updatedQuestion);
    setIsEditModalOpen(false);
    if (onQuestionUpdate) {
      onQuestionUpdate(updatedQuestion);
    }
  };

  const { isLoading: unclearLoading, toggleUnclear } = useUnclearQuestions(currentQuestion.id);

  // Toggle ChatGPT enhanced version: if currently chatgpt, switch to none; otherwise switch to chatgpt
  const handleToggleChatGPT = () => {
    const currentVersion = preferences?.enhancedAIVersion ?? 'none';
    const nextVersion: EnhancedAIVersion = currentVersion === 'chatgpt' ? 'none' : 'chatgpt';

    updatePreferences({ enhancedAIVersion: nextVersion });
  };

  // Toggle Gemini enhanced version: if currently gemini, switch to none; otherwise switch to gemini
  const handleToggleGemini = () => {
    const currentVersion = preferences?.enhancedAIVersion ?? 'none';
    const nextVersion: EnhancedAIVersion = currentVersion === 'gemini' ? 'none' : 'gemini';

    updatePreferences({ enhancedAIVersion: nextVersion });
  };

  // Handle difficulty change via keyboard shortcut
  const handleDifficultyChange = async (newDifficulty: number) => {
    if (!user) {
      toast.error('Du musst angemeldet sein, um die Schwierigkeit zu ändern');
      return;
    }

    if (newDifficulty < 1 || newDifficulty > 5) return;

    try {
      await setUserDifficulty(user.id, currentQuestion.id, newDifficulty);

      toast.info(`Schwierigkeitsgrad auf ${newDifficulty} gesetzt`);

      // Invalidate queries to refresh UI
      queryClient.invalidateQueries({ queryKey: ['user-progress', user.id] });

      // Trigger re-render of DifficultyControls
      setDifficultyUpdateKey((prev) => prev + 1);
    } catch (error) {
      console.error('Error updating difficulty:', error);
      toast.error('Fehler beim Aktualisieren des Schwierigkeitsgrads');
    }
  };

  // Keyboard shortcuts setup
  const keyboardActions: TrainingKeyboardActions = {
    onAnswerSelect: (answer: string) => {
      // Direct submission on key press, Amboss style
      handleAnswerClick(answer);
    },
    onConfirmAnswer: () => {
      // Enter key will also navigate to next question if feedback is shown
      if (showFeedback) {
        handleNext();
      }
    },
    onNextQuestion: () => {
      if (showFeedback) {
        handleNext();
      }
    },
    onShowSolution: () => {
      // Call handleShowSolution when keyboard shortcut is pressed
      handleShowSolution();
    },
    onToggleChatGPT: () => {
      handleToggleChatGPT();
    },
    onToggleGemini: () => {
      handleToggleGemini();
    },
    onDifficultyChange: (difficulty: number) => {
      handleDifficultyChange(difficulty);
    },
    canConfirm: !showFeedback, // Can "confirm" (i.e., answer) if feedback is not shown yet
    canNavigate: showFeedback, // Can navigate to next/prev when feedback is shown
    canShowSolution: !showFeedback && !preferences?.immediateFeedback, // Can show solution when button is visible
  };

  // Enable keyboard shortcuts
  useTrainingKeyboard(preferences.keyboardBindings, keyboardActions, true);

  const handleIgnoreQuestion = async () => {
    try {
      await toggleUnclear();

      if (onQuestionIgnored) {
        onQuestionIgnored(currentQuestion.id);
      }

      toast.success('Frage ignoriert und übersprungen');

      setTimeout(() => {
        handleNext();
      }, 1000);
    } catch (error) {
      console.error('Error ignoring question:', error);
      toast.error('Fehler beim Ignorieren der Frage');
    }
  };

  const handleShowSolution = async () => {
    // For free users, increment AI comment usage when showing solution
    if (!subscribed && currentQuestion.id !== usageIncrementedForQuestion) {
      if (canAccessAIComments) {
        let usageSuccess = false;
        await requirePremiumForAI(() => {
          console.log('AI comment usage incremented for showing solution');
          usageSuccess = true;
        });
        if (usageSuccess) {
          setUsageIncrementedForQuestion(currentQuestion.id);
          // After incrementing, check if they still have access
          setCanShowAIContent(dailyUsage + 1 < DAILY_LIMIT);
        } else {
          setCanShowAIContent(false);
        }
      } else {
        setCanShowAIContent(false);
      }
    } else if (subscribed) {
      setCanShowAIContent(true);
    } else if (currentQuestion.id === usageIncrementedForQuestion) {
      setCanShowAIContent(canAccessAIComments);
    }

    // Set the correct answer as selected so it auto-expands
    const correctAnswerLetter = currentQuestion.correctAnswer.charAt(0).toUpperCase();
    setSelectedAnswer(correctAnswerLetter);

    // Reveal the answer immediately
    handleAnswerSubmitted('solution_viewed', false, true);

    // Save as viewed solution in database (non-blocking). Viewing the solution
    // is explicitly *not* counted as a first attempt, so we pass false.
    // IMPORTANT: Do not derive any "first attempt" flags inside saveAnswerProgress;
    // they must always be computed by the caller and passed in.
    saveAnswerProgress('solution_viewed', false, true, false).catch((error) => {
      console.error('Error saving solution view:', error);
    });
  };

  if (!currentQuestion) {
    return <LoadingState label="Frage wird geladen …" />;
  }

  // Determine if image should be shown based on show_image_after_answer setting
  const shouldShowImage =
    currentQuestion.image_key &&
    (!currentQuestion.show_image_after_answer ||
      (currentQuestion.show_image_after_answer && showFeedback));

  // Determine which enhanced AI version to use
  // Enhanced question text should be shown immediately if user has access (not blocked by showFeedback)
  const enhancedVersion = preferences?.enhancedAIVersion ?? 'none';
  const canUseEnhanced = (subscribed || canAccessAIComments) && enhancedVersion !== 'none';
  const useChatGPT =
    canUseEnhanced &&
    enhancedVersion === 'chatgpt' &&
    aiCommentary?.answerComments?.chatgpt_regenerated_question;
  const useGemini =
    canUseEnhanced &&
    enhancedVersion === 'gemini' &&
    aiCommentary?.answerComments?.gemini_regenerated_question;
  const useClaude =
    canUseEnhanced &&
    enhancedVersion === 'claude' &&
    aiCommentary?.answerComments?.claude_regenerated_question;

  // Show loading state if AI commentary is loading and user has enhanced AI enabled
  // This prevents showing original question/options before AI-enhanced version loads
  const showEnhancedLoading = aiLoading && canUseEnhanced;

  // Use enhanced question if available and enabled, otherwise use original
  const displayQuestion = useChatGPT
    ? aiCommentary.answerComments.chatgpt_regenerated_question
    : useGemini
      ? aiCommentary.answerComments.gemini_regenerated_question
      : useClaude
        ? aiCommentary.answerComments.claude_regenerated_question
        : currentQuestion.question;

  const options = (['A', 'B', 'C', 'D', 'E'] as const)
    .map((letter) => {
      const optionKey = `option${letter}` as keyof Question;
      const originalText = currentQuestion[optionKey] as string;
      let text = originalText;
      let isAIGenerated = false;

      // Check if original option was empty
      const originalEmpty = !originalText || originalText.trim() === '';

      // Use enhanced option if available and enabled
      if ((useChatGPT || useGemini || useClaude) && aiCommentary?.answerComments) {
        const optionLower = letter.toLowerCase();

        if (useChatGPT) {
          const chatgptKey =
            `chatgpt_regenerated_option_${optionLower}` as keyof typeof aiCommentary.answerComments;
          if (aiCommentary.answerComments[chatgptKey]) {
            text = aiCommentary.answerComments[chatgptKey] as string;
            // Mark as AI-generated if original was empty
            isAIGenerated = originalEmpty;
          }
        } else if (useGemini) {
          const geminiKey =
            `gemini_regenerated_option_${optionLower}` as keyof typeof aiCommentary.answerComments;
          if (aiCommentary.answerComments[geminiKey]) {
            text = aiCommentary.answerComments[geminiKey] as string;
            // Mark as AI-generated if original was empty
            isAIGenerated = originalEmpty;
          }
        } else if (useClaude) {
          const claudeKey =
            `claude_regenerated_option_${optionLower}` as keyof typeof aiCommentary.answerComments;
          if (aiCommentary.answerComments[claudeKey]) {
            text = aiCommentary.answerComments[claudeKey] as string;
            // Mark as AI-generated if original was empty
            isAIGenerated = originalEmpty;
          }
        }
      }

      return { letter, text, isAIGenerated };
    })
    .filter((option) => option.text);

  const correctLetter = currentQuestion.correctAnswer.charAt(0).toUpperCase();
  // Said aloud by screen readers after each answer (role="status" below).
  const announcement = showFeedback
    ? isCorrect
      ? 'Richtig.'
      : `Richtig ist ${correctLetter}.`
    : wrongAnswers.length > 0
      ? `${wrongAnswers[wrongAnswers.length - 1]} ist falsch.`
      : '';

  const canShowSolutionButton = !showFeedback && !preferences?.immediateFeedback;

  const questionActions = isMobile ? (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Weitere Aktionen zur Frage">
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Brain className="mr-2 h-4 w-4" />
            KI-Modelle
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-56">
            <AIModelMenuItems />
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuItem onSelect={() => setIsEditModalOpen(true)}>
          <Pencil className="mr-2 h-4 w-4" />
          Bearbeiten
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={handleIgnoreQuestion}
          disabled={unclearLoading}
          className="text-danger-strong focus:text-danger-strong"
        >
          <X className="mr-2 h-4 w-4" />
          Frage ignorieren
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ) : (
    <div className="flex flex-wrap justify-end gap-1">
      <AIModelSelector />
      <Button variant="ghost" size="sm" onClick={() => setIsEditModalOpen(true)}>
        <Pencil aria-hidden="true" />
        Bearbeiten
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleIgnoreQuestion}
        className="text-danger-strong hover:bg-danger-subtle hover:text-danger-strong"
        disabled={unclearLoading}
      >
        <X aria-hidden="true" />
        Frage ignorieren
      </Button>
    </div>
  );

  const questionContent = (
    <>
      <p role="status" className="sr-only">
        {announcement}
      </p>
      <Card className="overflow-hidden">
        <div className="p-4 md:p-6">
          <div className="mb-4 flex items-start justify-between gap-3">
            <DifficultyControls
              key={`${currentQuestion.id}-${difficultyUpdateKey}`}
              questionId={currentQuestion.id}
              difficulty={currentQuestion.difficulty || 3}
              disabled={false}
              semester={currentQuestion.semester}
              year={currentQuestion.year}
              subject={currentQuestion.subject}
            />
            {questionActions}
          </div>

          {shouldShowImage && <QuestionImage imageKey={currentQuestion.image_key} />}

          {/* Hint when image is hidden due to settings */}
          {currentQuestion.image_key && !shouldShowImage && (
            <Callout variant="info" icon={<ImageIcon />} className="mb-4">
              Ein Bild ist verfügbar, wird aber erst nach der Beantwortung angezeigt. Diese
              Einstellung kann in „Bearbeiten“ geändert werden.
            </Callout>
          )}

          <article className="mb-2">
            {showEnhancedLoading ? (
              <div role="status" aria-label="Verbesserte Frage wird geladen" className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-4/5" />
              </div>
            ) : (
              <div className="flex items-start gap-3">
                <p className="max-w-[70ch] flex-1 whitespace-pre-line text-base leading-relaxed md:text-lg md:leading-[1.6]">
                  {displayQuestion}
                </p>
                {(useChatGPT || useGemini || useClaude) && (
                  <Badge variant="secondary" className="shrink-0 gap-1.5">
                    <ModelIcon
                      model={useChatGPT ? 'chatgpt' : useGemini ? 'new-gemini' : 'new-claude'}
                    />
                    KI-verbessert
                  </Badge>
                )}
              </div>
            )}
          </article>

          {showFeedback && (
            <div className="mt-4 space-y-1 rounded-md bg-muted px-3 py-2 text-sm">
              <p>
                <span className="font-semibold">Protokollierte Antwort:</span>{' '}
                {currentQuestion.correctAnswer}
              </p>
              {aiCommentary && canShowAIContent && aiConsensus && (
                <p>
                  <span className="font-semibold">KI-Modelle:</span>{' '}
                  {formatModelConsensus(aiConsensus)}
                </p>
              )}
              {currentQuestion.first_answer_stats && (subscribed || canShowAIContent) && (
                <p>
                  {/* the percentages on the answer rows mean little without their base */}
                  <span className="font-semibold">Andere:</span> Prozentwerte aus dem ersten Versuch
                  von {currentQuestion.first_answer_stats.total}{' '}
                  {currentQuestion.first_answer_stats.total === 1 ? 'Person' : 'Personen'}
                </p>
              )}
              {currentQuestion.comment && (
                <p>
                  <span className="font-semibold">Kommentar:</span> {currentQuestion.comment}
                </p>
              )}
            </div>
          )}
        </div>

        <div role="group" aria-label="Antwortmöglichkeiten" className="border-t">
          {showEnhancedLoading
            ? // Show skeleton loaders for all answer options while AI-enhanced content loads
              (['A', 'B', 'C', 'D', 'E'] as const)
                .map((letter) => {
                  const originalText = currentQuestion[
                    `option${letter}` as keyof Question
                  ] as string;
                  // Only show skeleton for options that exist
                  if (!originalText || originalText.trim() === '') return null;

                  return (
                    <div
                      key={letter}
                      className="flex min-h-12 items-center gap-3 border-b px-5 py-3 last:border-b-0"
                    >
                      <span className="w-4 text-center text-lg font-bold text-muted-foreground">
                        {letter}
                      </span>
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-5/6" />
                      </div>
                    </div>
                  );
                })
                .filter(Boolean)
            : options.map(({ letter, text, isAIGenerated }) => {
                const isCorrectOption = letter === correctLetter;
                // Get real statistics from database if available
                const stats = currentQuestion.first_answer_stats;
                const percentage = stats
                  ? (stats[letter.toLowerCase() as keyof typeof stats] as number) || 0
                  : null; // null indicates no data available

                // Show wrong attempts even when feedback is revealed (when returning to previous question)
                const wasAttempted = wrongAnswers.includes(letter);
                // Pass isSelected to AmbossAnswer - this is now just for identification, not auto-expansion
                const isSelected =
                  selectedAnswer?.charAt(0).toUpperCase() === letter ||
                  wrongAnswers.includes(letter);

                // Extract which models chose this answer option (only if user has access and can show AI content)
                const modelIcons: ModelName[] = [];
                if (aiCommentary && showFeedback && canShowAIContent) {
                  const models = aiCommentary.models;

                  // Check each new model's chosenAnswer and filter by user preferences
                  if (
                    models.chatgpt?.chosenAnswer?.toUpperCase() === letter &&
                    preferences.selectedAIModels?.includes('chatgpt')
                  ) {
                    modelIcons.push('chatgpt');
                  }
                  if (
                    models['new-gemini']?.chosenAnswer?.toUpperCase() === letter &&
                    preferences.selectedAIModels?.includes('new-gemini')
                  ) {
                    modelIcons.push('new-gemini');
                  }
                  if (
                    models['new-claude']?.chosenAnswer?.toUpperCase() === letter &&
                    preferences.selectedAIModels?.includes('new-claude')
                  ) {
                    modelIcons.push('new-claude');
                  }
                  if (
                    models.mistral?.chosenAnswer?.toUpperCase() === letter &&
                    preferences.selectedAIModels?.includes('mistral')
                  ) {
                    modelIcons.push('mistral');
                  }
                  if (
                    models.perplexity?.chosenAnswer?.toUpperCase() === letter &&
                    preferences.selectedAIModels?.includes('perplexity')
                  ) {
                    modelIcons.push('perplexity');
                  }
                  if (
                    models.deepseek?.chosenAnswer?.toUpperCase() === letter &&
                    preferences.selectedAIModels?.includes('deepseek')
                  ) {
                    modelIcons.push('deepseek');
                  }
                }

                // Show upgrade prompt if free user reached limit and trying to view AI comments
                const shouldShowUpgradePrompt = isFreeTier && !canShowAIContent && showFeedback;
                // Allow pre-reveal AI only if:
                // 1. Feedback is not shown yet
                // 2. Answer is selected or attempted
                // 3. User has access (canShowAIContent already checks if usage was incremented)
                const allowPreRevealAI =
                  !showFeedback && (isSelected || wasAttempted) && canShowAIContent;
                const shouldShowLoader = aiLoading && (canShowAIContent || allowPreRevealAI);

                return (
                  <AmbossAnswer
                    key={letter}
                    optionLetter={letter}
                    optionText={text}
                    isCorrect={isCorrectOption}
                    isRevealed={showFeedback}
                    percentage={percentage}
                    onClick={() => handleAnswerClick(letter)}
                    wasAttempted={wasAttempted}
                    isSelected={isSelected}
                    showPercentage={subscribed || canShowAIContent}
                    modelIcons={modelIcons}
                    showUpgradePrompt={shouldShowUpgradePrompt}
                    isAIGenerated={isAIGenerated}
                    onToggleExpandRef={toggleExpandRefs[letter]}
                  >
                    {(shouldShowLoader ||
                      (aiCommentary && (canShowAIContent || allowPreRevealAI))) &&
                      (shouldShowLoader ? (
                        <div className="space-y-2">
                          <Skeleton className="h-3 w-3/4" />
                          <Skeleton className="h-3 w-5/6" />
                          <Skeleton className="h-3 w-2/3" />
                        </div>
                      ) : (
                        <MultiModelAIComment commentaryData={aiCommentary} optionLetter={letter} />
                      ))}
                  </AmbossAnswer>
                );
              })}
        </div>
      </Card>

      <ActionBar
        onPrevious={onPrevious}
        onNext={handleNext}
        isFirstQuestion={currentIndex === 0}
        isLastQuestion={currentIndex === totalQuestions - 1}
        hasUserAnswer={isCorrect}
        wrongAttempts={wrongAnswers.length}
        showSolution={showSolution}
        onShowSolution={canShowSolutionButton ? handleShowSolution : undefined}
      />

      {canShowAIContent && (
        <GeneralAIComments commentaryData={aiCommentary} isRevealed={showFeedback} />
      )}

      {isFreeTier && remainingFreeViews !== undefined ? (
        <div className="mt-4 space-y-1 text-center text-sm text-muted-foreground">
          {
            <p>
              {remainingFreeViews > 0 ? (
                `${remainingFreeViews} kostenlose KI-Features heute verfügbar (Kommentare, Modell-Icons, erweiterte Versionen)`
              ) : (
                <>
                  Tägliches Limit erreicht.{' '}
                  <Link
                    to="/subscription"
                    className="font-semibold text-primary underline-offset-4 hover:underline"
                  >
                    Upgrade für unbegrenzte KI-Features
                  </Link>
                </>
              )}
            </p>
          }
        </div>
      ) : null}

      <EditQuestionModal
        question={currentQuestion}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onQuestionUpdated={handleQuestionUpdate}
      />
    </>
  );

  const sessionBar = (
    <SessionBar
      currentIndex={currentIndex}
      totalQuestions={totalQuestions}
      onQuit={onQuit}
      commentsCount={comments?.length ?? 0}
      commentsOpen={isCommentsOpen}
      onToggleComments={() => setIsCommentsOpen(!isCommentsOpen)}
      headingRef={headingRef}
    />
  );

  const commentsBody = (
    <CommentsSection
      questionId={currentQuestion.id}
      questionVisibility={currentQuestion.visibility || 'private'}
    />
  );

  // Phones and tablets: comments open as a sheet over the content.
  if (isMobile) {
    return (
      <div className="mx-auto w-full max-w-reading px-4 pb-28">
        {sessionBar}
        <Sheet open={isCommentsOpen} onOpenChange={setIsCommentsOpen}>
          <SheetContent
            id="comments-panel"
            side="right"
            className="w-full overflow-y-auto sm:max-w-md"
          >
            <SheetHeader>
              <SheetTitle>Kommentare & Notizen</SheetTitle>
            </SheetHeader>
            <div className="mt-4">{commentsBody}</div>
          </SheetContent>
        </Sheet>
        {questionContent}
      </div>
    );
  }

  // Desktop: resizable side panel; the question column moves aside to make room.
  return (
    <div className="w-full px-4 pb-8 md:px-6">
      <div className="mx-auto flex max-w-page items-start justify-center">
        <div className="w-full max-w-reading">
          {sessionBar}
          {questionContent}
        </div>
        {isCommentsOpen && (
          <div
            className={`flex-shrink ${!isResizing ? 'transition-all duration-200' : ''}`}
            style={{ width: `${Math.max(0, sidebarWidth)}px`, minWidth: 0 }}
          />
        )}
      </div>

      <aside
        id="comments-panel"
        ref={sidebarRef}
        aria-label="Kommentare & Notizen"
        hidden={!isCommentsOpen}
        onKeyDown={(e) => {
          if (e.key === 'Escape') setIsCommentsOpen(false);
        }}
        className={`fixed right-0 top-16 z-panel h-[calc(100dvh-4rem)] overflow-hidden border-l bg-card shadow-lg ${
          !isResizing ? 'transition-transform duration-200' : ''
        }`}
        style={{ width: `${sidebarWidth}px` }}
      >
        {/* Resize handle */}
        <div
          aria-hidden="true"
          className="group absolute bottom-0 left-0 top-0 z-10 w-2 cursor-col-resize transition-colors hover:bg-primary/40 active:bg-primary"
          onMouseDown={(e) => {
            e.preventDefault();
            setIsResizing(true);
          }}
        >
          <div className="absolute left-1/2 top-1/2 h-16 w-0.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/30 opacity-0 transition-opacity group-hover:opacity-100" />
        </div>
        <div className="h-full overflow-y-auto">
          <div className="flex items-center justify-between border-b p-4">
            <h2
              ref={panelHeadingRef}
              tabIndex={-1}
              className="flex items-center gap-2 font-semibold focus-visible:ring-0 focus-visible:ring-offset-0"
            >
              <MessageSquare aria-hidden="true" className="h-5 w-5" />
              Kommentare & Notizen
            </h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsCommentsOpen(false)}
              aria-label="Kommentare schließen"
            >
              <X />
            </Button>
          </div>
          <div className="p-4">{commentsBody}</div>
        </div>
      </aside>
    </div>
  );
};

export default QuestionDisplayWithAI;
