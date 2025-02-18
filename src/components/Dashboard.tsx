import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Question } from '@/types/Question';
import { useAuth } from '@/contexts/AuthContext';
import FileUpload from './FileUpload';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import DashboardHeader from './datasets/DashboardHeader';
import DatasetList from './datasets/DatasetList';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from 'lucide-react';
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useIsMobile } from '@/hooks/use-mobile';

const Dashboard = () => {
  const { user } = useAuth();
  const [selectedFilename, setSelectedFilename] = useState<string | null>(null);
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const { data: questions, isLoading, error, refetch } = useQuery({
    queryKey: ['questions', user?.id],
    queryFn: async () => {
      console.log('Fetching questions for user:', user?.id);
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching questions:', error);
        throw new Error('Fehler beim Laden der Fragen');
      }
      return data.map(q => ({
        id: q.id,
        question: q.question,
        optionA: q.option_a,
        optionB: q.option_b,
        optionC: q.option_c,
        optionD: q.option_d,
        optionE: q.option_e,
        subject: q.subject,
        correctAnswer: q.correct_answer,
        comment: q.comment,
        filename: q.filename,
        created_at: q.created_at,
        is_unclear: q.is_unclear,
        difficulty: q.difficulty
      })) as Question[];
    },
    enabled: !!user
  });

  const { data: todayNewCount } = useQuery({
    queryKey: ['today-new', user?.id],
    queryFn: async () => {
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);
      
      const { data, error } = await supabase
        .from('user_progress')
        .select('id')
        .eq('user_id', user?.id)
        .gte('created_at', today.toISOString());

      if (error) throw error;
      return data?.length ?? 0;
    },
    enabled: !!user
  });

  const { data: todayPracticeCount } = useQuery({
    queryKey: ['today-practice', user?.id],
    queryFn: async () => {
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);
      
      const { data, error } = await supabase
        .from('user_progress')
        .select('id')
        .eq('user_id', user?.id)
        .gte('updated_at', today.toISOString());

      if (error) throw error;
      return data?.length ?? 0;
    },
    enabled: !!user
  });


  const { data: totalAnsweredCount } = useQuery({
    queryKey: ['total-answers', user?.id],
    queryFn: async () => {
      console.log('Fetching total answers, user:', user?.id);
      
      const { count, error } = await supabase
        .from('user_progress')
        .select('*', { count: 'exact' })
        .eq('user_id', user?.id);

      if (error) {
        console.error('Error fetching total count:', error);
        throw error;
      }
      
      console.log('Total answered count:', count);
      return count || 0;
    },
    enabled: !!user
  });

  const {data: totalAttemptsCount } = useQuery({
    queryKey: ['total-attempts', user?.id],
    queryFn: async () => {
      console.log('Fetching total attempts, user:', user?.id);
      
      const { data, error } = await supabase
        .from('user_progress')
        .select('attempts_count')
        .eq('user_id', user?.id);

      if (error) {
        console.error('Error fetching total attempts:', error);
        throw error;
      }
      
      const totalAttempts = data.reduce((sum, record) => sum + (record.attempts_count || 1), 0);
      console.log('Total attempts count:', totalAttempts);
      return totalAttempts;
    },
    enabled: !!user
  });

  const groupedQuestions = useMemo(() => {
    if (!questions) return {};
    return questions.reduce((acc, question) => {
      if (!acc[question.filename]) {
        acc[question.filename] = [];
      }
      acc[question.filename].push(question);
      return acc;
    }, {} as Record<string, Question[]>);
  }, [questions]);

  const handleQuestionsLoaded = () => {
    refetch();
  };

  const handleDatasetClick = (filename: string) => {
    setSelectedFilename(selectedFilename === filename ? null : filename);
  };

  const handleStartTraining = (questions: Question[]) => {
    if (questions.length === 0) {
      toast.error('Keine Fragen verfügbar', {
        description: 'Bitte wählen Sie einen Datensatz mit Fragen aus'
      });
      return;
    }
    localStorage.setItem('trainingQuestions', JSON.stringify(questions));
    navigate('/training');
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-pulse text-slate-600">Lädt deine Fragen...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Fehler beim Laden der Fragen. Bitte versuche es später erneut.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className={`container mx-auto ${isMobile ? 'px-2' : 'px-4'} py-6 space-y-6 max-w-7xl`}>
      <section>
        <DashboardHeader />
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Heute</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <span className="text-sm text-muted-foreground">Neu</span>
                <p className="text-2xl font-bold">{todayNewCount ?? 0}</p>
              </div>
              <div className="space-y-1">
                <span className="text-sm text-muted-foreground">Wiederholt</span>
                <p className="text-2xl font-bold">
                  {Math.max(0, (todayPracticeCount ?? 0) - (todayNewCount ?? 0))}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-sm text-muted-foreground">Gesamt</span>
                <p className="text-2xl font-bold">{todayPracticeCount ?? 0}</p>
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
              <p className="text-2xl font-bold">{totalAnsweredCount ?? 0}</p>
            </div>
            <div className="space-y-1">
              <span className="text-sm text-muted-foreground">Versuche</span>
              <p className="text-2xl font-bold">{totalAttemptsCount ?? 0}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-xl md:text-2xl font-semibold text-slate-800 dark:text-zinc-50">
            Hochgeladene Fragendatenbanken
          </h2>
          <span className="text-sm text-muted-foreground">
            {questions?.length || 0} Fragen insgesamt
          </span>
        </div>
        
        {questions && questions.length > 0 ? (
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
                Noch keine Datensätze hochgeladen
              </p>
              <p className="text-sm text-muted-foreground">
                Lade eine CSV-Datei hoch, um mit dem Training zu beginnen
              </p>
            </CardContent>
          </Card>
        )}
      </section>

      <Separator className="my-6" />

      <section className="space-y-4">
        <Card className="bg-slate-50/50 dark:bg-zinc-900">
          <CardContent className={`${isMobile ? 'p-3' : 'pt-6'}`}>
            <FileUpload onQuestionsLoaded={handleQuestionsLoaded} />
          </CardContent>
        </Card>
      </section>
    </div>
  );
};

export default Dashboard;
