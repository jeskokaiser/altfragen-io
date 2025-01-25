import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Question } from '@/types/Question';
import { useAuth } from '@/contexts/AuthContext';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import FileUpload from './FileUpload';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Pencil } from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const [selectedFilename, setSelectedFilename] = useState<string | null>(null);
  const [editingFilename, setEditingFilename] = useState<string | null>(null);
  const [newFilename, setNewFilename] = useState('');
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: questions, isLoading, refetch } = useQuery({
    queryKey: ['questions', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
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
    // Invalidate and refetch the questions query to show the updated filename
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
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-slate-800">Dashboard</h1>
        <Button onClick={() => supabase.auth.signOut()}>Logout</Button>
      </div>

      <FileUpload onQuestionsLoaded={handleQuestionsLoaded} />

      <div className="mt-8">
        <h2 className="text-2xl font-semibold mb-4 text-slate-800">Ihre Datensätze</h2>
        {questions && questions.length > 0 ? (
          <div className="space-y-6">
            {Object.entries(groupedQuestions).map(([filename, fileQuestions]) => (
              <Card 
                key={filename} 
                className={`${
                  selectedFilename === filename ? 'ring-2 ring-primary' : ''
                }`}
              >
                <CardHeader className="bg-slate-50">
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      {editingFilename === filename ? (
                        <div className="flex items-center gap-2">
                          <Input
                            value={newFilename}
                            onChange={(e) => setNewFilename(e.target.value)}
                            className="max-w-md"
                            placeholder="Neuer Dateiname"
                          />
                          <Button 
                            onClick={() => handleSaveRename(filename)}
                            size="sm"
                          >
                            Speichern
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setEditingFilename(null)}
                          >
                            Abbrechen
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg font-medium text-slate-800">
                            {filename} ({fileQuestions.length} Fragen)
                          </CardTitle>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRename(filename)}
                            className="ml-2"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                    <Button onClick={() => handleStartTraining(fileQuestions)}>
                      Training starten
                    </Button>
                  </div>
                  <p className="text-sm text-slate-600">
                    Hochgeladen am {new Date(fileQuestions[0].created_at!).toLocaleDateString()}
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="cursor-pointer" onClick={() => handleDatasetClick(filename)}>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Anzahl der Fragen</TableHead>
                          <TableHead>Hochgeladen am</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell>{fileQuestions.length}</TableCell>
                          <TableCell>
                            {new Date(fileQuestions[0].created_at!).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>

                    {selectedFilename === filename && (
                      <div className="mt-4 space-y-4">
                        <h3 className="font-semibold">Fragen:</h3>
                        {fileQuestions.map((question, index) => (
                          <div key={question.id} className="p-4 bg-slate-50 rounded-lg">
                            <p className="font-medium">Frage {index + 1}:</p>
                            <p className="mt-1">{question.question}</p>
                            <div className="mt-2 space-y-1">
                              <p>A: {question.optionA}</p>
                              <p>B: {question.optionB}</p>
                              <p>C: {question.optionC}</p>
                              <p>D: {question.optionD}</p>
                              {question.optionE && <p>E: {question.optionE}</p>}
                            </div>
                            <p className="mt-2 text-green-600">Richtige Antwort: {question.correctAnswer}</p>
                            {question.comment && (
                              <p className="mt-2 text-slate-600">Kommentar: {question.comment}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
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