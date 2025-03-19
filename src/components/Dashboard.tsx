
import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Question } from '@/types/Question';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { fetchAllUserQuestions } from '@/services/DatabaseService';
import DatasetList from './datasets/DatasetList';
import FileUpload from './FileUpload';
import DashboardHeader from './datasets/DashboardHeader';
import { useIsMobile } from '@/hooks/use-mobile';
import { useUserPreferences } from '@/contexts/UserPreferencesContext';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from './ui/skeleton';

const Dashboard = () => {
  const { user, universityId } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { preferences, isDatasetArchived } = useUserPreferences();
  const [selectedFilename, setSelectedFilename] = useState<string | null>(null);

  const { data: questions, isLoading: questionsLoading, error: questionsError } = useQuery({
    queryKey: ['all-questions', user?.id, universityId],
    queryFn: async () => {
      if (!user?.id) return [];
      try {
        return await fetchAllUserQuestions(user.id, universityId);
      } catch (error) {
        console.error("Error fetching questions:", error);
        return [];
      }
    },
    enabled: !!user
  });

  const { data: todayNewCount, isLoading: newCountLoading } = useQuery({
    queryKey: ['today-new', user?.id],
    queryFn: async () => {
      try {
        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);
        const { data, error } = await supabase
          .from('user_progress')
          .select('id')
          .eq('user_id', user?.id)
          .gte('created_at', today.toISOString());
        if (error) throw error;
        return data?.length ?? 0;
      } catch (error) {
        console.error("Error fetching today's new count:", error);
        return 0;
      }
    },
    enabled: !!user
  });

  const { data: todayPracticeCount, isLoading: practiceCountLoading } = useQuery({
    queryKey: ['today-practice', user?.id],
    queryFn: async () => {
      try {
        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);
        const { data, error } = await supabase
          .from('user_progress')
          .select('id')
          .eq('user_id', user?.id)
          .gte('updated_at', today.toISOString());
        if (error) throw error;
        return data?.length ?? 0;
      } catch (error) {
        console.error("Error fetching today's practice count:", error);
        return 0;
      }
    },
    enabled: !!user
  });

  const { data: totalAnsweredCount, isLoading: totalAnsweredLoading } = useQuery({
    queryKey: ['total-answers', user?.id],
    queryFn: async () => {
      try {
        const { count, error } = await supabase
          .from('user_progress')
          .select('*', { count: 'exact' })
          .eq('user_id', user?.id);
        if (error) throw error;
        return count || 0;
      } catch (error) {
        console.error("Error fetching total answers count:", error);
        return 0;
      }
    },
    enabled: !!user
  });

  const { data: totalAttemptsCount, isLoading: totalAttemptsLoading } = useQuery({
    queryKey: ['total-attempts', user?.id],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('user_progress')
          .select('attempts_count')
          .eq('user_id', user?.id);
        if (error) throw error;
        const totalAttempts = data?.reduce((sum, record) => sum + (record.attempts_count || 1), 0) || 0;
        return totalAttempts;
      } catch (error) {
        console.error("Error fetching total attempts count:", error);
        return 0;
      }
    },
    enabled: !!user
  });

  const unarchivedQuestions = useMemo(() => {
    if (!questions || !Array.isArray(questions)) return [];
    return questions.filter(q => !isDatasetArchived(q.filename));
  }, [questions, isDatasetArchived]);

  const groupedQuestions = useMemo(() => {
    if (!unarchivedQuestions || !Array.isArray(unarchivedQuestions)) return {};
    return unarchivedQuestions.reduce((acc, question) => {
      if (!acc[question.filename]) {
        acc[question.filename] = [];
      }
      acc[question.filename].push(question);
      return acc;
    }, {} as Record<string, Question[]>);
  }, [unarchivedQuestions]);

  const handleDatasetClick = (filename: string) => {
    setSelectedFilename(selectedFilename === filename ? null : filename);
  };

  const handleStartTraining = (questions: Question[]) => {
    localStorage.setItem('trainingQuestions', JSON.stringify(questions));
    navigate('/training');
  };

  const handleQuestionsLoaded = () => {
    // Refresh the questions list
    window.location.reload();
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  const isLoading = questionsLoading || newCountLoading || practiceCountLoading || 
                   totalAnsweredLoading || totalAttemptsLoading;

  if (isLoading && (!questions || questions.length === 0)) {
    return (
      <div className="container mx-auto px-4 py-6 flex justify-center items-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Laden...</p>
        </div>
      </div>
    );
  }

  if (questionsError) {
    console.error("Error loading dashboard data:", questionsError);
    return (
      <div className="container mx-auto px-4 py-6 flex justify-center items-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-red-500 mb-2">Fehler beim Laden der Daten</p>
          <p className="text-muted-foreground">Bitte versuche es später erneut</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`container mx-auto ${isMobile ? 'px-2' : 'px-4'} py-6 space-y-6 max-w-7xl`}>
      <DashboardHeader />

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Heute</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <span className="text-sm text-muted-foreground">Neu</span>
                {newCountLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <p className="text-2xl font-bold">{todayNewCount ?? 0}</p>
                )}
              </div>
              <div className="space-y-1">
                <span className="text-sm text-muted-foreground">Wiederholt</span>
                {practiceCountLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <p className="text-2xl font-bold">
                    {Math.max(0, (todayPracticeCount ?? 0) - (todayNewCount ?? 0))}
                  </p>
                )}
              </div>
              <div className="space-y-1">
                <span className="text-sm text-muted-foreground">Gesamt</span>
                {practiceCountLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <p className="text-2xl font-bold">{todayPracticeCount ?? 0}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Insgesamt</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <span className="text-sm text-muted-foreground">Fragen</span>
              {totalAnsweredLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <p className="text-2xl font-bold">{totalAnsweredCount ?? 0}</p>
              )}
            </div>
            <div className="space-y-1">
              <span className="text-sm text-muted-foreground">Versuche</span>
              {totalAttemptsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <p className="text-2xl font-bold">{totalAttemptsCount ?? 0}</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-xl md:text-2xl font-semibold text-slate-800 dark:text-zinc-50">
            Fragendatenbanken
          </h2>
          <span className="text-sm text-muted-foreground">
            {unarchivedQuestions?.length || 0} Fragen insgesamt
          </span>
        </div>
        
        {questionsLoading ? (
          <Card>
            <CardContent className="py-6">
              <Skeleton className="h-12 w-full mb-2" />
              <Skeleton className="h-12 w-full mb-2" />
              <Skeleton className="h-12 w-full" />
            </CardContent>
          </Card>
        ) : unarchivedQuestions && unarchivedQuestions.length > 0 ? (
          <DatasetList
            groupedQuestions={groupedQuestions}
            selectedFilename={selectedFilename}
            onDatasetClick={handleDatasetClick}
            onStartTraining={handleStartTraining}
          />
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-lg text-slate-600 dark:text-zinc-300 mb-2">
                Keine Datensätze vorhanden
              </p>
              <p className="text-sm text-muted-foreground">
                Lade neue Datensätze hoch, um loszulegen
              </p>
            </CardContent>
          </Card>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl md:text-2xl font-semibold text-slate-800 dark:text-zinc-50">
            Datensatz hochladen
          </h2>
        </div>
        <FileUpload onQuestionsLoaded={handleQuestionsLoaded} />
      </section>
    </div>
  );
};

export default Dashboard;
