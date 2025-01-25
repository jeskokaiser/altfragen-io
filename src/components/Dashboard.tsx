import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Question } from '@/types/Question';
import { useAuth } from '@/contexts/AuthContext';
import FileUpload from './FileUpload';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import DashboardHeader from './datasets/DashboardHeader';
import DatasetList from './datasets/DatasetList';
import { useQuestions } from '@/hooks/useQuestions';
import { supabase } from '@/integrations/supabase/client';

const Dashboard = () => {
  const { user } = useAuth();
  const [selectedFilename, setSelectedFilename] = useState<string | null>(null);
  const [editingFilename, setEditingFilename] = useState<string | null>(null);
  const [newFilename, setNewFilename] = useState('');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: questions, isLoading, refetch } = useQuestions();

  const handleQuestionsLoaded = () => {
    refetch();
  };

  const handleRename = async (oldFilename: string) => {
    setEditingFilename(oldFilename);
    setNewFilename(oldFilename);
  };

  const handleSaveRename = async (oldFilename: string) => {
    if (!newFilename.trim()) {
      toast.error('Der Dateiname darf nicht leer sein');
      return;
    }

    const { error } = await supabase
      .from('questions')
      .update({ filename: newFilename.trim() })
      .eq('user_id', user?.id)
      .eq('filename', oldFilename);

    if (error) {
      toast.error('Fehler beim Umbenennen des Datensatzes');
      return;
    }

    setEditingFilename(null);
    setNewFilename('');
    await queryClient.invalidateQueries({ queryKey: ['questions', user?.id] });
    toast.success('Datensatz erfolgreich umbenannt');
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
    localStorage.setItem('trainingQuestions', JSON.stringify(questions));
    navigate('/training');
  };

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
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