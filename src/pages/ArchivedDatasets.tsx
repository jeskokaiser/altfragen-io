
import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import DatasetList from '@/components/datasets/DatasetList';
import { useIsMobile } from '@/hooks/use-mobile';
import { useUserPreferences } from '@/contexts/UserPreferencesContext';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';

interface QuestionSummary {
  id: string;
  filename: string;
  subject: string;
  difficulty: number;
  visibility: 'private' | 'university' | 'public';
  user_id: string | null;
  university_id: string | null;
  semester: string | null;
  year: string | null;
  exam_name: string | null;
  created_at: string;
}

const ArchivedDatasets = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { preferences } = useUserPreferences();
  const [selectedFilename, setSelectedFilename] = React.useState<string | null>(null);

  const { data: questions } = useQuery({
    queryKey: ['archived-questions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('questions')
        .select(`
          id,
          filename,
          subject,
          difficulty,
          visibility,
          user_id,
          university_id,
          exam_semester,
          exam_year,
          exam_name,
          created_at
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      return (data || []).map(q => ({
        id: q.id,
        filename: q.filename,
        subject: q.subject,
        difficulty: q.difficulty,
        visibility: (q.visibility as 'private' | 'university' | 'public') || 'private',
        user_id: q.user_id,
        university_id: q.university_id,
        semester: q.exam_semester,
        year: q.exam_year,
        exam_name: q.exam_name,
        created_at: q.created_at
      })) as QuestionSummary[];
    },
  });

  const archivedQuestions = useMemo(() => {
    if (!questions) return [];
    return questions.filter(q => preferences.archivedDatasets.includes(q.filename));
  }, [questions, preferences.archivedDatasets]);

  const groupedQuestions = useMemo(() => {
    return archivedQuestions.reduce((acc, question) => {
      // Use exam_name as the grouping key instead of filename
      const key = question.exam_name || question.filename;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(question);
      return acc;
    }, {} as Record<string, QuestionSummary[]>);
  }, [archivedQuestions]);

  const handleDatasetClick = (key: string) => {
    setSelectedFilename(selectedFilename === key ? null : key);
  };

  const handleStartTraining = (questions: QuestionSummary[]) => {
    localStorage.setItem('trainingQuestionIds', JSON.stringify(questions.map(q => q.id)));
    navigate('/training');
  };

  return (
    <div className={`container mx-auto ${isMobile ? 'px-2' : 'px-4'} py-6 space-y-6 max-w-7xl`}>
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          onClick={() => navigate('/dashboard')}
          className="mr-2"
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Zurück
        </Button>
        <h1 className="text-2xl md:text-3xl font-bold">Archivierte Datensätze</h1>
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-xl md:text-2xl font-semibold text-slate-800 dark:text-zinc-50">
            Archivierte Fragendatenbanken
          </h2>
          <span className="text-sm text-muted-foreground">
            {archivedQuestions?.length || 0} Fragen insgesamt
          </span>
        </div>
        
        {archivedQuestions && archivedQuestions.length > 0 ? (
          <DatasetList
            groupedQuestions={groupedQuestions}
            selectedFilename={selectedFilename}
            onDatasetClick={handleDatasetClick}
            onStartTraining={handleStartTraining}
            isArchived={true}
          />
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-lg text-slate-600 dark:text-zinc-300 mb-2">
                Keine archivierten Datensätze
              </p>
              <p className="text-sm text-muted-foreground">
                Archivierte Datensätze erscheinen hier
              </p>
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
};

export default ArchivedDatasets;
