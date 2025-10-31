import React, { useState, useMemo } from 'react';
import TrainingSessionsList from '@/components/training/TrainingSessionsList';
import TrainingSessionCreateDialog from '@/components/training/TrainingSessionCreateDialog';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useDashboardData } from '@/hooks/useDashboardData';

const TrainingSessionsPage: React.FC = () => {
  const { user, universityId } = useAuth();
  const { questions, isQuestionsLoading } = useDashboardData(user?.id, universityId);
  const [open, setOpen] = useState(false);

  const availableQuestions = useMemo(() => questions || [], [questions]);

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Trainings-Sessions</h1>
        <Button onClick={() => setOpen(true)} disabled={isQuestionsLoading}>Neue Session</Button>
      </div>

      <TrainingSessionsList />

      <TrainingSessionCreateDialog open={open} onOpenChange={setOpen} questions={availableQuestions} />
    </div>
  );
};

export default TrainingSessionsPage;
