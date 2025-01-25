import React from 'react';
import { useQuery } from '@tanstack/react-query';
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
import FileUpload from './FileUpload';

const Dashboard = () => {
  const { user } = useAuth();

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
              <div key={filename} className="rounded-md border">
                <div className="bg-slate-50 p-4 border-b">
                  <h3 className="text-lg font-medium text-slate-800">
                    {filename} ({fileQuestions.length} Fragen)
                  </h3>
                  <p className="text-sm text-slate-600">
                    Hochgeladen am {new Date(fileQuestions[0].created_at!).toLocaleDateString()}
                  </p>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fach</TableHead>
                      <TableHead>Anzahl der Fragen</TableHead>
                      <TableHead>Hochgeladen am</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>{fileQuestions[0].subject}</TableCell>
                      <TableCell>{fileQuestions.length}</TableCell>
                      <TableCell>
                        {new Date(fileQuestions[0].created_at!).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
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