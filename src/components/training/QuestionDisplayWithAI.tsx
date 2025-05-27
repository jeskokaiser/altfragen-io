
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Question } from '@/types/Question';
import { useAuth } from '@/contexts/AuthContext';
import QuestionHeader from './QuestionHeader';
import QuestionContent from './QuestionContent';
import NavigationButtons from './NavigationButtons';
import EditQuestionModal from './EditQuestionModal';
import AnswerSubmission from './AnswerSubmission';
import DifficultyControls from './DifficultyControls';
import QuestionFeedback from './QuestionFeedback';
import AICommentaryDisplay from '@/components/ai-commentary/AICommentaryDisplay';
import { AlertCircle, Brain, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AIAnswerCommentaryService } from '@/services/AIAnswerCommentaryService';
import { AICommentaryData } from '@/types/AIAnswerComments';

interface QuestionDisplayWithAIProps {
  questionData: Question;
  totalQuestions: number;
  currentIndex: number;
  onNext: () => void;
  onPrevious: () => void;
  onAnswer: (answer: string, isFirstAttempt: boolean, viewedSolution: boolean) => void;
  userAnswer: string;
  onQuit: () => void;
  onQuestionUpdate?: (updatedQuestion: Question) => void;
}

const QuestionDisplayWithAI: React.FC<QuestionDisplayWithAIProps> = ({
  questionData,
  totalQuestions,
  currentIndex,
  onNext,
  onPrevious,
  onAnswer,
  userAnswer,
  onQuit,
  onQuestionUpdate,
}) => {
  const [showFeedback, setShowFeedback] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<Question>(questionData);
  const [isCorrect, setIsCorrect] = useState(false);
  const [wrongAnswers, setWrongAnswers] = useState<string[]>([]);
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();

  // Fetch AI commentary data
  const { data: aiCommentary, isLoading: aiLoading, error: aiError } = useQuery({
    queryKey: ['ai-commentary', currentQuestion.id],
    queryFn: () => AIAnswerCommentaryService.getCommentaryForQuestion(currentQuestion.id),
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
    setSelectedAnswer('');
    setShowFeedback(false);
    setCurrentQuestion(questionData);
    setIsCorrect(false);
    setWrongAnswers([]);
  }, [questionData]);

  const handleAnswerChange = (answer: string) => {
    setSelectedAnswer(answer);
  };

  const handleAnswerSubmitted = (answer: string, correct: boolean, viewedSolution?: boolean) => {
    onAnswer(answer, wrongAnswers.length === 0, viewedSolution || false);
    setShowFeedback(true);
    setIsCorrect(correct);
    
    if (!correct) {
      setWrongAnswers(prev => [...prev, answer]);
    }
    
    // Remove automatic navigation - let user manually proceed
  };

  const handleNext = () => {
    setShowFeedback(false);
    setSelectedAnswer('');
    setIsCorrect(false);
    setWrongAnswers([]);
    onNext();
  };

  const handleQuestionUpdate = (updatedQuestion: Question) => {
    setCurrentQuestion(updatedQuestion);
    setIsEditModalOpen(false);
    if (onQuestionUpdate) {
      onQuestionUpdate(updatedQuestion);
    }
  };

  const handleMarkUnclear = async () => {
    try {
      const { error } = await supabase
        .from('questions')
        .update({
          is_unclear: true,
          marked_unclear_at: new Date().toISOString(),
        })
        .eq('id', currentQuestion.id);

      if (error) throw error;

      toast.info('Frage als unklar markiert');
      setCurrentQuestion({
        ...currentQuestion,
        is_unclear: true,
        marked_unclear_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error marking question as unclear:', error);
      toast.error('Fehler beim Markieren der Frage');
    }
  };

  const renderAICommentary = () => {
    // Only show AI commentary when feedback is visible
    if (!showFeedback) return null;

    if (aiLoading) {
      return (
        <Card className="mt-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center py-4">
              <RefreshCw className="h-6 w-6 animate-spin mr-2" />
              <span>Lade KI-Kommentare...</span>
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
                Fehler beim Laden der KI-Kommentare. Bitte versuchen Sie es später erneut.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      );
    }

    if (!aiCommentary) {
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
                  disabled={queueForProcessing.isPending}
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
        {/* Navigation buttons above AI commentary */}
        <NavigationButtons
          onPrevious={onPrevious}
          onNext={handleNext}
          isFirstQuestion={currentIndex === 0}
          isLastQuestion={currentIndex === totalQuestions - 1}
          hasUserAnswer={!!userAnswer && isCorrect}
          wrongAttempts={wrongAnswers.length}
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
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size={isMobile ? "sm" : "default"}
              onClick={handleMarkUnclear}
              className="flex items-center gap-2 hover:bg-gray-100"
              disabled={currentQuestion.is_unclear}
            >
              <AlertCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Unklar</span>
              <span className="sm:hidden">?!</span>
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
        />

        <AnswerSubmission
          currentQuestion={currentQuestion}
          selectedAnswer={selectedAnswer}
          user={user}
          onAnswerSubmitted={handleAnswerSubmitted}
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
        hasUserAnswer={!!userAnswer && isCorrect}
        wrongAttempts={wrongAnswers.length}
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
