import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTrainingSession } from '@/hooks/useTrainingSessions';
import { fetchQuestionDetails } from '@/services/DatabaseService';
import { Question } from '@/types/Question';
import QuestionDisplayWithAI from '@/components/training/QuestionDisplayWithAI';
import { TrainingSessionService } from '@/services/TrainingSessionService';

const TrainingSessionRunnerPage: React.FC = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { session, isLoading, setIndex, setStatus, refresh } = useTrainingSession(sessionId, user?.id);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [localCurrentIndex, setLocalCurrentIndex] = useState<number | null>(null);

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

  const handleAnswer = async (answer: string, isFirstAttempt: boolean, viewedSolution: boolean) => {
    if (!session || !user || !currentQuestion) return;
    const isCorrect = currentQuestion.correctAnswer?.toUpperCase().startsWith(answer.toUpperCase());
    await TrainingSessionService.recordAttempt({
      sessionId: session.id,
      userId: user.id,
      questionId: currentQuestion.id,
      answer,
      isCorrect,
      viewedSolution,
    });
  };

  if (isLoading || !session) {
    return <div className="flex items-center justify-center min-h-[50vh]">Lade Session…</div>;
  }

  if (!currentQuestion) {
    return <div className="flex items-center justify-center min-h-[50vh]">Keine Frage gefunden.</div>;
  }

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
          userAnswer={''}
          onQuit={handleQuit}
          onSessionRecordAttempt={async (answer, isCorrect, viewedSolution) => {
            if (!session || !user || !currentQuestion) return;
            await TrainingSessionService.recordAttempt({
              sessionId: session.id,
              userId: user.id,
              questionId: currentQuestion.id,
              answer,
              isCorrect,
              viewedSolution,
            });
          }}
        />
      </div>
    </div>
  );
};

export default TrainingSessionRunnerPage;
