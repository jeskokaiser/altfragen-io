import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Question } from '@/types/Question';
import { AnswerState } from '@/types/Answer';
import { useAuth } from '@/contexts/AuthContext';
import QuestionHeader from './QuestionHeader';
import NavigationButtons from './NavigationButtons';
import EditQuestionModal from './EditQuestionModal';
import DifficultyControls from './DifficultyControls';
import QuestionImage from '@/components/questions/QuestionImage';
import { Pencil, X, Image as ImageIcon } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AIAnswerCommentaryService } from '@/services/AIAnswerCommentaryService';
import { AICommentaryData } from '@/types/AIAnswerComments';
import { useUserPreferences } from '@/contexts/UserPreferencesContext';
import { useTrainingKeyboard, TrainingKeyboardActions } from '@/hooks/useTrainingKeyboard';
import { AmbossAnswer } from './AmbossAnswer';
import { MultiModelAIComment } from './MultiModelAIComment';
import { GeneralAIComments } from './GeneralAIComments';
import { ModelName } from './ModelIcon';
import { AIModelSelector } from './AIModelSelector';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';
import { useUnclearQuestions } from '@/hooks/useUnclearQuestions';
import { usePremiumFeatures } from '@/hooks/usePremiumFeatures';
import CommentsSection from './CommentsSection';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { MessageSquare } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface QuestionDisplayWithAIProps {
  questionData: Question;
  totalQuestions: number;
  currentIndex: number;
  onNext: () => void;
  onPrevious: () => void;
  onAnswer: (answer: string, isFirstAttempt: boolean, viewedSolution: boolean) => void;
  // Optional: per-session recording; when provided, we call it instead of default save to user_progress
  onSessionRecordAttempt?: (answer: string, isCorrect: boolean, viewedSolution?: boolean) => Promise<void>;
  userAnswer: string;
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
  userAnswer,
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
  const [usageIncrementedForQuestion, setUsageIncrementedForQuestion] = useState<string | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [initialAnswer, setInitialAnswer] = useState<string | null>(null);
  const [canShowAIContent, setCanShowAIContent] = useState(false);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();
  const { preferences } = useUserPreferences();
  const { 
    subscribed, 
    remainingFreeViews, 
    requirePremiumForAI,
    isFreeTier,
    canAccessAIComments,
    dailyUsage,
    DAILY_LIMIT
  } = usePremiumFeatures();

  // Fetch AI commentary data
  const { data: aiCommentary, isLoading: aiLoading, error: aiError } = useQuery({
    queryKey: ['ai-commentary', currentQuestion.id],
    queryFn: () => AIAnswerCommentaryService.getCommentaryForQuestion(currentQuestion.id),
    enabled: !!currentQuestion.id
  });

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
    }
    
    // Initialize/restore state from userAnswerState if it exists
    // This runs both on first render and when navigating back to a question
    if (userAnswerState?.attempts && userAnswerState.attempts.length > 0) {
      const wrongAttempts = userAnswerState.attempts.filter(
        attempt => attempt.charAt(0).toLowerCase() !== questionData.correctAnswer.charAt(0).toLowerCase()
      );
      const firstWrong = userAnswerState.attempts.find(
        attempt => attempt.charAt(0).toLowerCase() !== questionData.correctAnswer.charAt(0).toLowerCase()
      );
      
      setWrongAnswers(wrongAttempts);
      setFirstWrongAnswer(firstWrong || null);
      setShowFeedback(true);
      setIsCorrect(userAnswerState.value.charAt(0).toLowerCase() === questionData.correctAnswer.charAt(0).toLowerCase());
      setSelectedAnswer(userAnswerState.value);
      
      // Set initial answer from user answer state if available
      if (userAnswerState.originalAnswer) {
        setInitialAnswer(userAnswerState.originalAnswer);
      } else if (userAnswerState.attempts.length > 0) {
        setInitialAnswer(userAnswerState.attempts[0]);
      }
      
      // Check if solution was viewed
      if (userAnswerState.viewedSolution) {
        setShowSolution(true);
      }
    }
    
    // Update currentQuestion reference if it's a new question
    if (isNewQuestion) {
      setCurrentQuestion(questionData);
    }
  }, [questionData.id, questionData.correctAnswer, userAnswerState]);
  
  // Sync canShowAIContent with access state and question state
  useEffect(() => {
    if (!showFeedback) {
      // Don't show AI content if feedback isn't shown
      setCanShowAIContent(false);
    } else if (subscribed) {
      // Premium users can always see AI content
      setCanShowAIContent(true);
    } else if (currentQuestion.id === usageIncrementedForQuestion) {
      // Already incremented for this question - check current access
      setCanShowAIContent(canAccessAIComments);
    } else {
      // Haven't incremented yet - don't show AI content
      setCanShowAIContent(false);
    }
  }, [showFeedback, subscribed, canAccessAIComments, currentQuestion.id, usageIncrementedForQuestion]);

  // Database progress saving logic
  const saveAnswerProgress = async (answer: string, isAnswerCorrect: boolean, viewedSolution: boolean = false) => {
    if (onSessionRecordAttempt) {
      // Delegate to session recording when running inside a session
      await onSessionRecordAttempt(answer, isAnswerCorrect, viewedSolution);
      return;
    }
    if (!user || answer === 'solution_viewed') return;

    try {
      const { data: existingProgress, error: fetchError } = await supabase
        .from('user_progress')
        .select('is_correct, attempts_count')
        .eq('user_id', user.id)
        .eq('question_id', currentQuestion.id)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (!existingProgress) {
        const { error: insertError } = await supabase
          .from('user_progress')
          .insert({
            user_id: user.id,
            question_id: currentQuestion.id,
            user_answer: answer,
            is_correct: isAnswerCorrect,
            attempts_count: 1
          });

        if (insertError) throw insertError;
      } else {
        const { error: updateError } = await supabase
          .from('user_progress')
          .update({
            user_answer: answer,
            attempts_count: (existingProgress.attempts_count || 1) + 1,
            is_correct: isAnswerCorrect ? (preferences?.immediateFeedback || wrongAnswers.length === 0) : existingProgress.is_correct
          })
          .eq('user_id', user.id)
          .eq('question_id', currentQuestion.id);

        if (updateError) throw updateError;
      }

      // Invalidate dashboard queries to ensure fresh data when user returns
      queryClient.invalidateQueries({ queryKey: ['today-new', user.id] });
      queryClient.invalidateQueries({ queryKey: ['today-practice', user.id] });
      queryClient.invalidateQueries({ queryKey: ['total-answers', user.id] });
      queryClient.invalidateQueries({ queryKey: ['total-attempts', user.id] });
      queryClient.invalidateQueries({ queryKey: ['user-progress', user.id] });
      
    } catch (error) {
      console.error('Error saving answer progress:', error);
      toast.error("Fehler beim Speichern des Fortschritts");
    }
  };

  const handleAnswerSubmitted = (answer: string, correct: boolean, viewedSolution?: boolean) => {
    // Don't add to wrongAnswers if it's a "solution_viewed" action
    if (answer !== 'solution_viewed') {
    onAnswer(answer, wrongAnswers.length === 0 && !firstWrongAnswer, viewedSolution || false);
      
      if (!correct) {
        if (!firstWrongAnswer) {
          setFirstWrongAnswer(answer);
        }
        setWrongAnswers(prev => [...prev, answer]);
      }
    } else {
      // For solution_viewed, just update the answer state
      onAnswer(answer, false, true);
    }
    
    setShowFeedback(true);
    setIsCorrect(correct);
    
    if (viewedSolution) {
      setShowSolution(true);
    }
  };

  const handleAnswerClick = async (answer: string) => {
    if (showFeedback) return;

    const isAnswerCorrect = answer.charAt(0).toLowerCase() === currentQuestion.correctAnswer.charAt(0).toLowerCase();
    
    // Track which answer was selected
    setSelectedAnswer(answer);
    
    // Track initial answer (first click only)
    if (!initialAnswer) {
      setInitialAnswer(answer);
    }
    
    // For free users, increment AI comment usage when revealing answer (which shows percentages and AI comments)
    if (!subscribed && currentQuestion.id !== usageIncrementedForQuestion) {
      const willReveal = preferences?.immediateFeedback || isAnswerCorrect;
      if (willReveal) {
        // Check access before incrementing - if they're at the limit, don't increment
        if (canAccessAIComments) {
          let usageSuccess = false;
          await requirePremiumForAI(() => {
            console.log('AI comment usage incremented for revealing answer');
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
      } else {
        // Won't reveal yet - don't show AI content
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
    if (preferences?.immediateFeedback || isAnswerCorrect) {
      handleAnswerSubmitted(answer, isAnswerCorrect, true);
    } else {
      // In normal mode with wrong answer: record the attempt but don't reveal yet
      // This allows the user to try again
      if (!firstWrongAnswer) {
        setFirstWrongAnswer(answer);
      }
      setWrongAnswers(prev => [...prev, answer]);
      onAnswer(answer, wrongAnswers.length === 0 && !firstWrongAnswer, false);
      
      // No toast needed - AI comments show immediately
    }
    
    // Save to database in the background (non-blocking)
    saveAnswerProgress(answer, isAnswerCorrect, false).catch(error => {
      console.error('Error saving answer progress:', error);
      // Don't show error toast for background saves to avoid disrupting flow
    });
  };

  const handleNext = () => {
    setShowFeedback(false);
    setIsCorrect(false);
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

  const { isUnclear, isLoading: unclearLoading, toggleUnclear } = useUnclearQuestions(currentQuestion.id);

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
      // No-op, solution is shown on selection
    },
    canConfirm: !showFeedback, // Can "confirm" (i.e., answer) if feedback is not shown yet
    canNavigate: showFeedback, // Can navigate to next/prev when feedback is shown
    canShowSolution: false, // Not a separate step anymore
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
    
    // Save as viewed solution in database (non-blocking)
    saveAnswerProgress('solution_viewed', false, true).catch(error => {
      console.error('Error saving solution view:', error);
    });
  };

  if (!currentQuestion) {
    return <div>Loading question...</div>;
  }

  // Determine if image should be shown based on show_image_after_answer setting
  const shouldShowImage = currentQuestion.image_key && 
    (!currentQuestion.show_image_after_answer || (currentQuestion.show_image_after_answer && showFeedback));

  // Determine which enhanced AI version to use
  // Enhanced question text should be shown immediately if user has access (not blocked by showFeedback)
  const enhancedVersion = preferences?.enhancedAIVersion ?? 'none';
  const canUseEnhanced = (subscribed || canAccessAIComments) && enhancedVersion !== 'none';
  const useChatGPT = canUseEnhanced && enhancedVersion === 'chatgpt' && aiCommentary?.answerComments?.chatgpt_regenerated_question;
  const useGemini = canUseEnhanced && enhancedVersion === 'gemini' && aiCommentary?.answerComments?.gemini_regenerated_question;
  
  // Use enhanced question if available and enabled, otherwise use original
  const displayQuestion = useChatGPT
    ? aiCommentary.answerComments.chatgpt_regenerated_question 
    : useGemini
      ? aiCommentary.answerComments.gemini_regenerated_question
      : currentQuestion.question;

  const options = (['A', 'B', 'C', 'D', 'E'] as const).map(letter => {
    const optionKey = `option${letter}` as keyof Question;
    const originalText = currentQuestion[optionKey] as string;
    let text = originalText;
    let isAIGenerated = false;
    
    // Check if original option was empty
    const originalEmpty = !originalText || originalText.trim() === '';
    
    // Use enhanced option if available and enabled
    if ((useChatGPT || useGemini) && aiCommentary?.answerComments) {
      const optionLower = letter.toLowerCase();
      
      if (useChatGPT) {
        const chatgptKey = `chatgpt_regenerated_option_${optionLower}` as keyof typeof aiCommentary.answerComments;
        if (aiCommentary.answerComments[chatgptKey]) {
          text = aiCommentary.answerComments[chatgptKey] as string;
          // Mark as AI-generated if original was empty
          isAIGenerated = originalEmpty;
        }
      } else if (useGemini) {
        const geminiKey = `gemini_regenerated_option_${optionLower}` as keyof typeof aiCommentary.answerComments;
        if (aiCommentary.answerComments[geminiKey]) {
          text = aiCommentary.answerComments[geminiKey] as string;
          // Mark as AI-generated if original was empty
          isAIGenerated = originalEmpty;
        }
      }
    }
    
    return { letter, text, isAIGenerated };
  }).filter(option => option.text);

  const questionContent = (
    <>
      <Card className={`${isMobile ? 'p-3' : 'p-0'}`}>
        <div className="p-4">
          <div className="flex flex-row flex-wrap items-start gap-3 mb-4">
            <div className="flex-grow">
              <DifficultyControls
                questionId={currentQuestion.id}
                difficulty={currentQuestion.difficulty || 3}
                onEditClick={() => setIsEditModalOpen(true)}
                disabled={false}
                semester={currentQuestion.semester}
                year={currentQuestion.year}
                subject={currentQuestion.subject}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <AIModelSelector />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditModalOpen(true)}
                className="flex items-center gap-2"
                >
                <Pencil className="h-4 w-4" />
                Bearbeiten
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleIgnoreQuestion}
                className="flex items-center gap-2 hover:bg-red-50 hover:text-red-600 border-red-200"
                disabled={unclearLoading}
              >
                <X className="h-4 w-4" />
                Frage ignorieren
              </Button>
            </div>
          </div>

          {shouldShowImage && <QuestionImage imageKey={currentQuestion.image_key} />}
          
          {/* Hint when image is hidden due to settings */}
          {currentQuestion.image_key && !shouldShowImage && (
            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg flex items-start gap-2">
              <ImageIcon className="h-4 w-4 mt-0.5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
              <p className="text-sm text-blue-800 dark:text-blue-200">
                Ein Bild ist verfügbar, wird aber erst nach der Beantwortung angezeigt. 
                Diese Einstellung kann in "Bearbeiten" geändert werden.
              </p>
            </div>
          )}

          <article className="prose max-w-none mb-4">
            <div className="flex items-start gap-2">
              <p className="flex-1">{displayQuestion}</p>
              {(useChatGPT || useGemini) && (
                <span className="text-xs px-2 py-1 bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 rounded-md font-medium shrink-0">
                  {useChatGPT ? 'ChatGPT' : 'Gemini'}-verbessert
                </span>
              )}
            </div>
          </article>

          {showFeedback && (
            <div className="mb-4 space-y-2 text-sm">
              <div>
                <span className="font-semibold">Protokollierte Antwort:</span> {currentQuestion.correctAnswer}
              </div>
              {currentQuestion.comment && (
                <div>
                  <span className="font-semibold">Kommentar:</span> {currentQuestion.comment}
                </div>
              )}
            </div>
          )}

          {/* Lösung anzeigen moved below NavigationButtons */}
        </div>
        
        <div className="rounded-b-lg">
            {options.map(({ letter, text, isAIGenerated }) => {
                const isCorrectOption = letter === currentQuestion.correctAnswer.charAt(0).toUpperCase();
                
                // Get real statistics from database if available
                const stats = currentQuestion.first_answer_stats;
                const percentage = stats 
                  ? (stats[letter.toLowerCase() as keyof typeof stats] as number) || 0
                  : null; // null indicates no data available
                
                // Show wrong attempts even when feedback is revealed (when returning to previous question)
                const wasAttempted = wrongAnswers.includes(letter);
                // Pass isSelected to AmbossAnswer - this is now just for identification, not auto-expansion
                const isSelected = selectedAnswer?.charAt(0).toUpperCase() === letter ||
                                   wrongAnswers.includes(letter);

                // Extract which models chose this answer option (only if user has access and can show AI content)
                const modelIcons: ModelName[] = [];
                if (aiCommentary && showFeedback && canShowAIContent) {
                  const optionLower = letter.toLowerCase() as 'a' | 'b' | 'c' | 'd' | 'e';
                  const models = aiCommentary.models;
                  
                  // Check each new model's chosenAnswer and filter by user preferences
                  if (models.chatgpt?.chosenAnswer?.toUpperCase() === letter && preferences.selectedAIModels?.includes('chatgpt')) {
                    modelIcons.push('chatgpt');
                  }
                  if (models['new-gemini']?.chosenAnswer?.toUpperCase() === letter && preferences.selectedAIModels?.includes('new-gemini')) {
                    modelIcons.push('new-gemini');
                  }
                  if (models.mistral?.chosenAnswer?.toUpperCase() === letter && preferences.selectedAIModels?.includes('mistral')) {
                    modelIcons.push('mistral');
                  }
                  if (models.perplexity?.chosenAnswer?.toUpperCase() === letter && preferences.selectedAIModels?.includes('perplexity')) {
                    modelIcons.push('perplexity');
                  }
                  if (models.deepseek?.chosenAnswer?.toUpperCase() === letter && preferences.selectedAIModels?.includes('deepseek')) {
                    modelIcons.push('deepseek');
                  }
                }

                // Show upgrade prompt if free user reached limit and trying to view AI comments
                const shouldShowUpgradePrompt = isFreeTier && !canShowAIContent && showFeedback;

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
                        showPercentage={true}
                        modelIcons={modelIcons}
                        showUpgradePrompt={shouldShowUpgradePrompt}
                        isAIGenerated={isAIGenerated}
                    >
                        {aiCommentary && canShowAIContent && (
                            <MultiModelAIComment commentaryData={aiCommentary} optionLetter={letter} />
                        )}
                    </AmbossAnswer>
                );
            })}
        </div>
      </Card>

      <NavigationButtons
        onPrevious={onPrevious}
        onNext={handleNext}
        isFirstQuestion={currentIndex === 0}
        isLastQuestion={currentIndex === totalQuestions - 1}
        hasUserAnswer={isCorrect}
        wrongAttempts={wrongAnswers.length}
        showSolution={showSolution}
      />

      {canShowAIContent && (
        <GeneralAIComments 
          commentaryData={aiCommentary}
          isRevealed={showFeedback}
        />
      )}

      {showFeedback && currentQuestion.first_answer_stats && (
        <div className="mt-3 flex justify-center">
          <p className="text-xs text-slate-500">
            Beantwortet von {currentQuestion.first_answer_stats.total} Personen
          </p>
        </div>
      )}
      
      {isFreeTier && remainingFreeViews !== undefined && (
        <div className="mt-2 flex justify-center">
          <p className="text-xs text-slate-400">
            {remainingFreeViews > 0 
              ? `${remainingFreeViews} kostenlose KI-Features heute verfügbar (Kommentare, Modell-Icons, erweiterte Versionen)`
              : 'Tägliches Limit erreicht. Upgrade für unbegrenzte KI-Features.'}
          </p>
        </div>
      )}

      {!showFeedback && !preferences?.immediateFeedback && (
        <div className="mt-4 flex justify-center">
          <Button
            variant="outline"
            size="default"
            onClick={handleShowSolution}
            className="text-slate-600 hover:text-slate-900"
          >
            Lösung anzeigen
          </Button>
        </div>
      )}

      <EditQuestionModal
        question={currentQuestion}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onQuestionUpdated={handleQuestionUpdate}
      />
    </>
  );

  // Mobile: Use Sheet for sidebar
  if (isMobile) {
    return (
      <div className={`w-full max-w-4xl mx-auto px-2`}>
        <QuestionHeader
          currentIndex={currentIndex}
          totalQuestions={totalQuestions}
          onQuit={onQuit}
        />
        
        <Sheet open={isCommentsOpen} onOpenChange={setIsCommentsOpen}>
          <SheetTrigger asChild>
            <Button
              variant="default"
              size="icon"
              className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50"
            >
              <MessageSquare className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
            <CommentsSection
              questionId={currentQuestion.id}
              questionVisibility={currentQuestion.visibility || 'private'}
            />
          </SheetContent>
        </Sheet>

        {questionContent}
      </div>
    );
  }

  // Desktop: Use collapsible sidebar
  return (
    <div className="w-full max-w-7xl mx-auto flex gap-4 pt-20">
      <div className={`flex-1 min-w-0 transition-all ${isCommentsOpen ? 'mr-[400px]' : ''}`}>
        <QuestionHeader
          currentIndex={currentIndex}
          totalQuestions={totalQuestions}
          onQuit={onQuit}
        />

        {questionContent}
      </div>

      {/* Floating comment icon button */}
      <Button
        variant="default"
        size="icon"
        onClick={() => setIsCommentsOpen(!isCommentsOpen)}
        className={`fixed bottom-8 right-8 h-14 w-14 rounded-full shadow-lg z-50 transition-all ${
          isCommentsOpen ? 'opacity-50' : ''
        }`}
      >
        <MessageSquare className="h-6 w-6" />
      </Button>

      <Collapsible open={isCommentsOpen} onOpenChange={setIsCommentsOpen}>
        <div
          className={`fixed right-0 top-16 h-[calc(100vh-4rem)] w-[400px] bg-background border-l shadow-lg transition-transform duration-300 z-40 overflow-y-auto ${
            isCommentsOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="p-4 border-b flex items-center justify-between bg-background">
            <h2 className="font-semibold flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Kommentare & Notizen
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCommentsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="p-4">
            <CommentsSection
              questionId={currentQuestion.id}
              questionVisibility={currentQuestion.visibility || 'private'}
            />
          </div>
        </div>
      </Collapsible>
    </div>
  );
};

export default QuestionDisplayWithAI;
