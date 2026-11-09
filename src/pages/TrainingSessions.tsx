import React, { useState, useMemo, useEffect } from 'react';
import { Page, PageHeader } from '@/components/ds/PageHeader';
import { useLocation, Link } from 'react-router-dom';
import TrainingSessionsList from '@/components/training/TrainingSessionsList';
import TrainingSessionCreateDialog from '@/components/training/TrainingSessionCreateDialog';
import { useAuth } from '@/contexts/AuthContext';
import { useDashboardData } from '@/hooks/useDashboardData';
import { useTrainingSessions } from '@/hooks/useTrainingSessions';

const TrainingSessionsPage: React.FC = () => {
  const { user, universityId } = useAuth();
  const location = useLocation();
  const { questions } = useDashboardData(user?.id, universityId);
  const { refetch } = useTrainingSessions(user?.id);
  const [open, setOpen] = useState(false);

  // Refetch sessions when navigating to this page to ensure fresh data
  useEffect(() => {
    if (user?.id && location.pathname === '/training/sessions') {
      refetch();
    }
  }, [location.pathname, user?.id, refetch]);

  const availableQuestions = useMemo(() => questions || [], [questions]);

  // Check if user has reached the session limit (5 for free users)

  // Generate default title with current date whenever the dialog opens
  const defaultTitle = useMemo(() => {
    if (open) {
      return `${new Date().toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })} – Training`;
    }
    return '';
  }, [open]);

  return (
    <Page width="reading">
      <PageHeader
        eyebrow={
          <Link
            to="/dashboard"
            className="font-semibold text-primary underline-offset-4 hover:underline"
          >
            ← Dashboard
          </Link>
        }
        title="Meine Trainings-Sessions"
        description="Verwalte deine Trainingssessions und verfolge deinen Lernfortschritt. Sessions können für spezifische Prüfungen oder zum allgemeinen Training erstellt werden."
      />

      <TrainingSessionsList />

      <TrainingSessionCreateDialog
        open={open}
        onOpenChange={setOpen}
        questions={availableQuestions}
        defaultTitle={defaultTitle}
      />
    </Page>
  );
};

export default TrainingSessionsPage;
