import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Question } from '@/types/Question';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import DatasetList from './datasets/DatasetList';
import FileUpload from './FileUpload';
import DashboardHeader from './datasets/DashboardHeader';
import { useIsMobile } from '@/hooks/use-mobile';
import { useUserPreferences } from '@/contexts/UserPreferencesContext';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { preferences } = useUserPreferences();
  const [selectedFilename, setSelectedFilename] = useState<string | null>(null);

  const { data: questions } = useQuery({
    queryKey: ['questions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Question[];
    },
  });

  const unarchivedQuestions = useMemo(() => {
    if (!questions) return [];
    return questions.filter(q => !preferences.isDatasetArchived(q.filename));
  }, [questions, preferences]);

  const groupedQuestions = useMemo(() => {
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

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className={`container mx-auto ${isMobile ? 'px-2' : 'px-4'} py-6 space-y-6 max-w-7xl`}>
      <DashboardHeader />

      <section className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-xl md:text-2xl font-semibold text-slate-800 dark:text-zinc-50">
            Fragendatenbanken
          </h2>
          <span className="text-sm text-muted-foreground">
            {unarchivedQuestions?.length || 0} Fragen insgesamt
          </span>
        </div>
        
        {unarchivedQuestions && unarchivedQuestions.length > 0 ? (
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
        <FileUpload />
      </section>
    </div>
  );
};

export default Dashboard;
