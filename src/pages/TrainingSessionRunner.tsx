import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTrainingSession } from '@/hooks/useTrainingSessions';
import { fetchQuestionDetails } from '@/services/DatabaseService';
import { Question } from '@/types/Question';
import { AnswerState } from '@/types/Answer';
import QuestionDisplayWithAI from '@/components/training/QuestionDisplayWithAI';
import { TrainingSessionService } from '@/services/TrainingSessionService';

const TrainingSessionRunnerPage: React.FC = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { session, isLoading, setIndex, setStatus, refresh } = useTrainingSession(sessionId, user?.id);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [localCurrentIndex, setLocalCurrentIndex] = useState<number | null>(null);
  const [questionProgress, setQuestionProgress] = useState<Map<string, AnswerState>>(new Map());

  // Use local index if set, otherwise fall back to session index
  const currentIndex = localCurrentIndex ?? session?.current_index ?? 0;
  const totalQuestions = session?.total_questions ?? 0;
  const questionIds = session?.question_ids ?? [];

  useEffect(() => {
    const load = async () => {
      if (!session) return;
      if (!questionIds.length) return;
      const full = await fetchQuestionDetails(questionIds);
      // Keep session order
      const map = new Map(full.map(q => [q.id, q]));
      setQuestions(questionIds.map(id => map.get(id)).filter(Boolean) as Question[]);
      // Initialize local index from session
      setLocalCurrentIndex(session.current_index ?? 0);
    };
    load();
  }, [sessionId, session?.updated_at]);

  const currentQuestion = useMemo(() => questions[currentIndex], [questions, currentIndex]);

  // Fetch progress for current question
  useEffect(() => {
    const loadProgress = async () => {
      if (!session || !user || !currentQuestion) return;
      
      // Skip if we already have progress for this question
      if (questionProgress.has(currentQuestion.id)) return;
      
      try {
        const progress = await TrainingSessionService.getQuestionProgress({
          sessionId: session.id,
          userId: user.id,
          questionId: currentQuestion.id,
        });
        
        if (progress) {
          // Construct attempts array from initial and last answer
          const attempts: string[] = [];
          if (progress.initial_answer) {
            attempts.push(progress.initial_answer);
          }
          // Add last answer if different from initial
          if (progress.last_answer && progress.last_answer !== progress.initial_answer) {
            attempts.push(progress.last_answer);
          }
          
          // Use last_answer if available, otherwise initial_answer
          const finalAnswer = progress.last_answer || progress.initial_answer;
          
          if (finalAnswer) {
            const answerState: AnswerState = {
              value: finalAnswer,
              isFirstAttempt: progress.attempts_count === 1,
              viewedSolution: progress.viewed_solution || false,
              attempts: attempts,
              originalAnswer: progress.initial_answer || undefined,
            };
            
            setQuestionProgress(prev => new Map(prev).set(currentQuestion.id, answerState));
          }
        }
      } catch (error) {
        console.error('Error loading question progress:', error);
      }
    };
    
    loadProgress();
  }, [session?.id, user?.id, currentQuestion?.id]);

  const handleNext = async () => {
    if (!session) return;
    const nextIndex = currentIndex + 1;
    if (nextIndex >= (session.total_questions || 0)) {
      // Update status to completed in background
      setStatus('completed').catch(error => {
        console.error('Error updating session status:', error);
      });
      // Navigate to session analytics page
      navigate(`/training/session/${sessionId}/analytics`);
      return;
    }
    // Update UI immediately
    setLocalCurrentIndex(nextIndex);
    // Sync to database in background
    setIndex(nextIndex).catch(error => {
      console.error('Error updating session index:', error);
    });
  };

  const handlePrevious = async () => {
    if (!session) return;
    const prevIndex = Math.max(0, currentIndex - 1);
    // Update UI immediately
    setLocalCurrentIndex(prevIndex);
    // Sync to database in background
    setIndex(prevIndex).catch(error => {
      console.error('Error updating session index:', error);
    });
  };

  const handleQuit = async () => {
    await setStatus('paused');
    navigate(`/training/session/${sessionId}/analytics`);
  };

  // This handler is just for notifying the component about state changes
  // The actual database write is handled by onSessionRecordAttempt below
  const handleAnswer = async (answer: string, isFirstAttempt: boolean, viewedSolution: boolean) => {
    // Clear cached progress for this question so it's refetched next time
    if (currentQuestion) {
      setQuestionProgress(prev => {
        const newMap = new Map(prev);
        newMap.delete(currentQuestion.id);
        return newMap;
      });
    }
  };

  if (isLoading || !session) {
    return <div className="flex items-center justify-center min-h-[50vh]">Lade Session…</div>;
  }

  if (!currentQuestion) {
    return <div className="flex items-center justify-center min-h-[50vh]">Keine Frage gefunden.</div>;
  }

  const currentAnswerState = currentQuestion ? questionProgress.get(currentQuestion.id) : undefined;

  return (
    <div className="bg-slate-50 min-h-screen">
      <div className="py-8">
        <QuestionDisplayWithAI
          questionData={currentQuestion}
          totalQuestions={totalQuestions}
          currentIndex={currentIndex}
          onNext={handleNext}
          onPrevious={handlePrevious}
          onAnswer={handleAnswer}
          userAnswer={currentAnswerState?.value || ''}
          userAnswerState={currentAnswerState}
          onQuit={handleQuit}
          onSessionRecordAttempt={async (answer, isCorrect, viewedSolution) => {
            if (!session || !user || !currentQuestion) return;
            
            // Safety check: if isCorrect is not explicitly provided, calculate it
            // This prevents TypeError if correctAnswer is null/undefined
            const finalIsCorrect = isCorrect ?? (
              currentQuestion.correctAnswer
                ? currentQuestion.correctAnswer.toUpperCase().startsWith(answer.toUpperCase())
                : false
            );
            
            await TrainingSessionService.recordAttempt({
              sessionId: session.id,
              userId: user.id,
              questionId: currentQuestion.id,
              answer,
              isCorrect: finalIsCorrect,
              viewedSolution,
            });
          }}
        />
      </div>
    </div>
  );
};

export default TrainingSessionRunnerPage;
