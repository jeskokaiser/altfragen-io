import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Question } from '@/types/Question';
import { AnswerState } from '@/types/Answer';
import { useAuth } from '@/contexts/AuthContext';
import QuestionHeader from './QuestionHeader';
import QuestionContent from './QuestionContent';
import NavigationButtons from './NavigationButtons';
import EditQuestionModal from './EditQuestionModal';
import AnswerSubmission from './AnswerSubmission';
import DifficultyControls from './DifficultyControls';
import QuestionFeedback from './QuestionFeedback';
import AICommentaryDisplay from '@/components/ai-commentary/AICommentaryDisplay';
import PremiumBadge from '@/components/subscription/PremiumBadge';
import { AlertCircle, Brain, RefreshCw, Crown, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AIAnswerCommentaryService } from '@/services/AIAnswerCommentaryService';
import { AICommentaryData } from '@/types/AIAnswerComments';
import { useUserPreferences } from '@/contexts/UserPreferencesContext';
import { usePremiumFeatures } from '@/hooks/usePremiumFeatures';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useUnclearQuestions } from '@/hooks/useUnclearQuestions';

interface QuestionDisplayWithAIProps {
  questionData: Question;
  totalQuestions: number;
  currentIndex: number;
  onNext: () => void;
  onPrevious: () => void;
  onAnswer: (answer: string, isFirstAttempt: boolean, viewedSolution: boolean) => void;
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
}) => {
  const [showFeedback, setShowFeedback] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<Question>(questionData);
  const [isCorrect, setIsCorrect] = useState(false);
  const [wrongAnswers, setWrongAnswers] = useState<string[]>([]);
  const [firstWrongAnswer, setFirstWrongAnswer] = useState<string | null>(null);
  const [showSolution, setShowSolution] = useState(false);
  const [usageIncrementedForQuestion, setUsageIncrementedForQuestion] = useState<string | null>(null);
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();
  const { preferences } = useUserPreferences();
  const isDemoMode = questionData.id.startsWith('demo-');

  const { 
    isPremium, 
    canAccessAIComments: canAccessHook, 
    loading: premiumLoading, 
    requirePremiumForAI, 
    isFreeTier, 
    incrementUsage,
    isIncrementing 
  } = usePremiumFeatures();
  const { createCheckoutSession } = useSubscription();
  
  const canAccessAIComments = isDemoMode || canAccessHook;

  // Fetch AI commentary data
  const { data: aiCommentary, isLoading: aiLoading, error: aiError } = useQuery({
    queryKey: ['ai-commentary', currentQuestion.id],
    queryFn: () => {
      if (isDemoMode) {
        const demoCommentaries = JSON.parse(localStorage.getItem('demoAiCommentaries') || '{}');
        return Promise.resolve(demoCommentaries[currentQuestion.id] || null);
      }
      return AIAnswerCommentaryService.getCommentaryForQuestion(currentQuestion.id);
    },
    enabled: !!currentQuestion.id
  });

  // Queue question for AI processing
  const queueForProcessing = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('questions')
        .update({
          ai_commentary_status: 'pending',
          ai_commentary_queued_at: new Date().toISOString()
        })
        .eq('id', currentQuestion.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Frage für KI-Verarbeitung eingeplant');
      queryClient.invalidateQueries({ queryKey: ['ai-commentary', currentQuestion.id] });
    },
    onError: (error) => {
      toast.error('Fehler beim Einplanen der Frage');
      console.error('Error queueing question:', error);
    }
  });

  useEffect(() => {
    // Only reset state if we're actually moving to a different question
    if (currentQuestion.id !== questionData.id) {
      setSelectedAnswer('');
      setShowFeedback(false);
      setCurrentQuestion(questionData);
      setIsCorrect(false);
      setShowSolution(false);
      setUsageIncrementedForQuestion(null); // Reset for new question
      setWrongAnswers([]);
      setFirstWrongAnswer(null);
      
      // Initialize state from userAnswerState if it exists
      if (userAnswerState?.attempts && userAnswerState.attempts.length > 0) {
        setWrongAnswers(userAnswerState.attempts.filter(attempt => attempt.charAt(0).toLowerCase() !== questionData.correctAnswer.charAt(0).toLowerCase()));
        setFirstWrongAnswer(userAnswerState.attempts.find(attempt => attempt.charAt(0).toLowerCase() !== questionData.correctAnswer.charAt(0).toLowerCase()) || null);
        setShowFeedback(true);
        setIsCorrect(userAnswerState.value.charAt(0).toLowerCase() === questionData.correctAnswer.charAt(0).toLowerCase());
        
        // Check if solution was viewed
        if (userAnswerState.viewedSolution) {
          setShowSolution(true);
        }
      }
    }
  }, [questionData.id, userAnswerState]);

  // Handle usage increment when AI comments should be shown for free tier users
  useEffect(() => {
    const shouldShowAICommentary = showFeedback && (isCorrect || showSolution);
    const shouldIncrementUsage = shouldShowAICommentary && 
                                 isFreeTier && 
                                 aiCommentary && 
                                 canAccessAIComments &&
                                 !isIncrementing &&
                                 usageIncrementedForQuestion !== currentQuestion.id &&
                                 !isDemoMode; // Do not increment usage for demo

    if (shouldIncrementUsage) {
      console.log(`Incrementing usage for question ${currentQuestion.id}`);
      incrementUsage().then((success) => {
        if (success) {
          setUsageIncrementedForQuestion(currentQuestion.id);
          console.log(`Usage incremented successfully for question ${currentQuestion.id}`);
        }
      }).catch((error) => {
        console.error('Failed to increment usage:', error);
      });
    }
  }, [showFeedback, isCorrect, showSolution, isFreeTier, aiCommentary, canAccessAIComments, incrementUsage, currentQuestion.id, usageIncrementedForQuestion, isIncrementing, isDemoMode]);

  const handleAnswerChange = (answer: string) => {
    setSelectedAnswer(answer);
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
    
    // Remove automatic navigation - let user manually proceed
  };

  const handleNext = () => {
    setShowFeedback(false);
    setSelectedAnswer('');
    setIsCorrect(false);
    setWrongAnswers([]);
    setFirstWrongAnswer(null);
    setUsageIncrementedForQuestion(null); // Reset for next question
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

  const handleIgnoreQuestion = async () => {
    if (isDemoMode) {
      toast.info('Demo-Frage kann nicht ignoriert werden');
      return;
    }

    try {
      await toggleUnclear();
      
      // Notify parent component that this question was ignored
      if (onQuestionIgnored) {
        onQuestionIgnored(currentQuestion.id);
      }
      
      toast.success('Frage ignoriert und übersprungen');
      
      // Immediately skip to next question
      setTimeout(() => {
        handleNext();
      }, 800);
      
    } catch (error) {
      console.error('Error ignoring question:', error);
      toast.error('Fehler beim Ignorieren der Frage');
    }
  };

  const renderAICommentary = () => {
    // Show AI commentary when the user has answered correctly OR when solution is shown
    const shouldShowAICommentary = showFeedback && (isCorrect || showSolution);
    
    if (!shouldShowAICommentary) return null;

    // Check if user has access to AI comments (either premium or free views remaining)
    if (!canAccessAIComments) {
      return (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              KI-Kommentare
              <PremiumBadge />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-6 space-y-4">
              <Crown className="h-16 w-16 mx-auto text-blue-500" />
              <div>
                <h3 className="text-lg font-semibold mb-2">Tägliches Limit erreicht</h3>
                <p className="text-gray-600 mb-4">
                  Du hast heute alle kostenlosen KI-Kommentare verwendet. 
                  Upgraden für unbegrenzten Zugang!
                </p>
                <Button 
                  onClick={createCheckoutSession}
                  className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
                >
                  <Crown className="h-4 w-4" />
                  Jetzt upgraden!
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }

    if (aiLoading || (isIncrementing && !isDemoMode)) {
      return (
        <Card className="mt-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center py-4">
              <RefreshCw className="h-6 w-6 animate-spin mr-2" />
              <span>{isIncrementing && !isDemoMode ? 'Verarbeite Nutzung...' : 'Lade KI-Kommentare...'}</span>
            </div>
          </CardContent>
        </Card>
      );
    }

    if (aiError) {
      return (
        <Card className="mt-6">
          <CardContent className="pt-6">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Fehler beim Laden der KI-Kommentare. Bitte versuche es später erneut.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      );
    }

    if (!aiCommentary) {
      // In demo mode, commentary should always be available. This part is for real questions.
      return (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              KI-Kommentare
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-4 space-y-4">
              <Brain className="h-12 w-12 mx-auto text-gray-400" />
              <div>
                <p className="text-gray-600 mb-4">
                  Für diese Frage sind noch keine KI-Kommentare verfügbar.
                </p>
                <Button 
                  onClick={() => queueForProcessing.mutate()}
                  disabled={queueForProcessing.isPending || isDemoMode}
                  className="flex items-center gap-2"
                >
                  <Brain className="h-4 w-4" />
                  {queueForProcessing.isPending ? 'Wird eingeplant...' : 'KI-Analyse anfordern'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="mt-6 space-y-4">
        {/* Duplicate Navigation Buttons Above AI Comments */}
        <NavigationButtons
          onPrevious={onPrevious}
          onNext={handleNext}
          isFirstQuestion={currentIndex === 0}
          isLastQuestion={currentIndex === totalQuestions - 1}
          hasUserAnswer={(!!userAnswer && isCorrect) || (showFeedback && preferences?.immediateFeedback)}
          wrongAttempts={wrongAnswers.length}
          showSolution={showSolution}
        />
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              KI-Kommentare
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AICommentaryDisplay 
              commentaryData={aiCommentary}
              questionData={{
                optionA: currentQuestion.optionA,
                optionB: currentQuestion.optionB,
                optionC: currentQuestion.optionC,
                optionD: currentQuestion.optionD,
                optionE: currentQuestion.optionE,
                correctAnswer: currentQuestion.correctAnswer
              }}
            />
          </CardContent>
        </Card>
      </div>
    );
  };

  if (!currentQuestion) {
    return <div>Loading question...</div>;
  }

  return (
    <div className={`w-full max-w-4xl mx-auto ${isMobile ? 'px-2' : ''}`}>
      <QuestionHeader
        currentIndex={currentIndex}
        totalQuestions={totalQuestions}
        onQuit={onQuit}
      />

      <Card className={`${isMobile ? 'p-3' : 'p-6'}`}>
        <div className={`flex flex-col sm:flex-row sm:items-stretch gap-3 mb-4`}>
          <div className="flex-grow">
            <DifficultyControls
              questionId={currentQuestion.id}
              difficulty={currentQuestion.difficulty || 3}
              onEditClick={() => setIsEditModalOpen(true)}
              disabled={isDemoMode}
              semester={currentQuestion.semester}
              year={currentQuestion.year}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size={isMobile ? "sm" : "default"}
              onClick={handleIgnoreQuestion}
              className="flex items-center gap-2 hover:bg-red-50 hover:text-red-600 border-red-200"
              disabled={unclearLoading || isDemoMode}
            >
              <X className="h-4 w-4" />
              <span className="hidden sm:inline">Frage ignorieren</span>
              <span className="sm:hidden">Ignore</span>
            </Button>
          </div>
        </div>

        <QuestionContent
          questionData={currentQuestion}
          selectedAnswer={selectedAnswer}
          onAnswerChange={handleAnswerChange}
          onConfirmAnswer={() => {}}
          showFeedback={showFeedback}
          wrongAnswers={wrongAnswers}
          firstWrongAnswer={firstWrongAnswer}
          correctAnswer={currentQuestion.correctAnswer}
          isCorrect={isCorrect}
          showSolution={showSolution}
        />

        <AnswerSubmission
          currentQuestion={currentQuestion}
          selectedAnswer={selectedAnswer}
          user={user}
          onAnswerSubmitted={handleAnswerSubmitted}
          showSolution={showSolution}
          wrongAnswers={wrongAnswers}
        />

        <QuestionFeedback
          showFeedback={showFeedback}
          userAnswer={userAnswer}
          correctAnswer={currentQuestion.correctAnswer}
          comment={currentQuestion.comment}
          isCorrect={isCorrect}
          wrongAnswers={wrongAnswers}
        />

        {renderAICommentary()}
      </Card>

      <NavigationButtons
        onPrevious={onPrevious}
        onNext={handleNext}
        isFirstQuestion={currentIndex === 0}
        isLastQuestion={currentIndex === totalQuestions - 1}
        hasUserAnswer={(!!userAnswer && isCorrect) || (showFeedback && preferences?.immediateFeedback)}
        wrongAttempts={wrongAnswers.length}
        showSolution={showSolution}
      />

      <EditQuestionModal
        question={currentQuestion}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onQuestionUpdated={handleQuestionUpdate}
      />
    </div>
  );
};

export default QuestionDisplayWithAI;
