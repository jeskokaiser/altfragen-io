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
        comment: q.comment
      })) as Question[];
    },
    enabled: !!user
  });

  const handleQuestionsLoaded = () => {
    refetch();
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
        <h2 className="text-2xl font-semibold mb-4 text-slate-800">Ihre Fragen</h2>
        {questions && questions.length > 0 ? (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Frage</TableHead>
                  <TableHead>Fach</TableHead>
                  <TableHead>Richtige Antwort</TableHead>
                  <TableHead>Erstellt am</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {questions.map((question) => (
                  <TableRow key={question.id}>
                    <TableCell className="font-medium">{question.question}</TableCell>
                    <TableCell>{question.subject}</TableCell>
                    <TableCell>
                      {question.correctAnswer}: {question[`option${question.correctAnswer}` as keyof Question]}
                    </TableCell>
                    <TableCell>{new Date(question.created_at).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-8 text-slate-600">
            Noch keine Fragen hochgeladen
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;