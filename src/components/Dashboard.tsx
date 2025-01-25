import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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

const Dashboard = () => {
  const { user } = useAuth();
  const [selectedFilename, setSelectedFilename] = useState<string | null>(null);
  const [editingFilename, setEditingFilename] = useState<string | null>(null);
  const [newFilename, setNewFilename] = useState('');
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: questions, isLoading, error, refetch } = useQuery({
    queryKey: ['questions', user?.id],
    queryFn: async () => {
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
        created_at: q.created_at
      })) as Question[];
    },
    enabled: !!user
  });

  const handleQuestionsLoaded = () => {
    refetch();
  };

  const handleRename = async (oldFilename: string) => {
    setEditingFilename(oldFilename);
    setNewFilename(oldFilename);
  };

  const handleSaveRename = async (oldFilename: string) => {
    if (!newFilename.trim()) {
      toast.error('Der Dateiname darf nicht leer sein', {
        description: 'Bitte geben Sie einen gültigen Namen ein'
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('questions')
        .update({ filename: newFilename.trim() })
        .eq('user_id', user?.id)
        .eq('filename', oldFilename);

      if (error) throw error;

      setEditingFilename(null);
      setNewFilename('');
      await queryClient.invalidateQueries({ queryKey: ['questions', user?.id] });
      toast.success('Datensatz erfolgreich umbenannt');
    } catch (error: any) {
      console.error('Error renaming dataset:', error);
      toast.error('Fehler beim Umbenennen', {
        description: error.message || 'Ein unerwarteter Fehler ist aufgetreten'
      });
    }
  };

  // Group questions by filename
  const groupedQuestions = React.useMemo(() => {
    if (!questions) return {};
    return questions.reduce((acc, question) => {
      if (!acc[question.filename]) {
        acc[question.filename] = [];
      }
      acc[question.filename].push(question);
      return acc;
    }, {} as Record<string, Question[]>);
  }, [questions]);

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
        <div className="animate-pulse text-slate-600">Lädt Ihre Fragen...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Fehler beim Laden der Fragen. Bitte versuchen Sie es später erneut.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      <DashboardHeader />
      <FileUpload onQuestionsLoaded={handleQuestionsLoaded} />

      <div className="mt-8">
        <h2 className="text-2xl font-semibold mb-4 text-slate-800">Ihre Datensätze</h2>
        {questions && questions.length > 0 ? (
          <DatasetList
            groupedQuestions={groupedQuestions}
            selectedFilename={selectedFilename}
            onDatasetClick={handleDatasetClick}
            onStartTraining={handleStartTraining}
            editingFilename={editingFilename}
            newFilename={newFilename}
            onNewFilenameChange={(value) => setNewFilename(value)}
            onRename={handleRename}
            onSaveRename={handleSaveRename}
            onCancelRename={() => setEditingFilename(null)}
          />
        ) : (
          <div className="text-center py-8 text-slate-600">
            Noch keine Datensätze hochgeladen
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;