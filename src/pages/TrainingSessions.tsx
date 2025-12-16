import React, { useState, useMemo, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import TrainingSessionsList from '@/components/training/TrainingSessionsList';
import TrainingSessionCreateDialog from '@/components/training/TrainingSessionCreateDialog';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useDashboardData } from '@/hooks/useDashboardData';
import { useTrainingSessions } from '@/hooks/useTrainingSessions';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useUpcomingExams } from '@/hooks/useUpcomingExams';
import { Plus, Lock } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const TrainingSessionsPage: React.FC = () => {
  const { user, universityId } = useAuth();
  const { subscribed } = useSubscription();
  const location = useLocation();
  const { questions, isQuestionsLoading } = useDashboardData(user?.id, universityId);
  const { sessions, refetch } = useTrainingSessions(user?.id);
  const { exams } = useUpcomingExams(user?.id);
  const [open, setOpen] = useState(false);

  // Refetch sessions when navigating to this page to ensure fresh data
  useEffect(() => {
    if (user?.id && location.pathname === '/training/sessions') {
      refetch();
    }
  }, [location.pathname, user?.id, refetch]);

  const availableQuestions = useMemo(() => questions || [], [questions]);
  
  // Check if user has reached the session limit (5 for free users)
  const totalSessions = sessions?.length || 0;
  const hasReachedSessionLimit = !subscribed && totalSessions >= 5;

  // Generate default title with current date whenever the dialog opens
  const defaultTitle = useMemo(() => {
    if (open) {
      return `${new Date().toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })} – Training`;
    }
    return '';
  }, [open]);

  // Get the first exam for the analytics link
  const firstExam = exams && exams.length > 0 ? exams[0] : null;

  return (
    <div className="container mx-auto py-8 max-w-5xl">
      <div className="mb-6">
        <div className="mb-4">
          {firstExam ? (
            <Link to={`/dashboard`} className="text-primary hover:underline text-sm font-medium">
              ← Dashboard
            </Link>
          ) : null}
        </div>
        <div className="flex items-start justify-between mb-2">
          <div>
            <h1 className="text-3xl font-bold mb-2">Meine Trainings-Sessions</h1>
            <p className="text-muted-foreground">
              Verwalte deine Trainingssessions und verfolge deinen Lernfortschritt. 
              Sessions können für spezifische Prüfungen oder zum allgemeinen Training erstellt werden.
            </p>
          </div>
          


        </div>
      </div>

      <TrainingSessionsList />

      <TrainingSessionCreateDialog 
        open={open} 
        onOpenChange={setOpen} 
        questions={availableQuestions}
        defaultTitle={defaultTitle}
      />
    </div>
  );
};

export default TrainingSessionsPage;
