import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Question } from '@/types/Question';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const UnclearQuestions = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: questions, isLoading, error } = useQuery({
    queryKey: ['unclear-questions', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('user_id', user?.id)
        .eq('is_unclear', true)
        .order('marked_unclear_at', { ascending: false });

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
        created_at: q.created_at,
        difficulty: q.difficulty,
        is_unclear: q.is_unclear,
        marked_unclear_at: q.marked_unclear_at
      })) as Question[];
    },
    enabled: !!user
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-pulse text-slate-600">Lädt unklare Fragen...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Fehler beim Laden der Fragen. Bitte versuche es später erneut.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const groupedQuestions = questions?.reduce((acc, question) => {
    if (!acc[question.filename]) {
      acc[question.filename] = [];
    }
    acc[question.filename].push(question);
    return acc;
  }, {} as Record<string, Question[]>) || {};

  return (
    <div className="container mx-auto px-4 py-8 space-y-8 max-w-7xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-800">Unklare Fragen</h1>
        <Button variant="outline" onClick={() => navigate('/')}>
          Zurück zum Dashboard
        </Button>
      </div>

      <div className="space-y-6">
        {Object.entries(groupedQuestions).map(([filename, questions]) => (
          <Card key={filename}>
            <CardHeader>
              <CardTitle className="text-lg font-medium">
                {filename} ({questions.length} unklare {questions.length === 1 ? 'Frage' : 'Fragen'})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Frage</TableHead>
                    <TableHead>Markiert am</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {questions.map((question) => (
                    <TableRow key={question.id}>
                      <TableCell className="font-medium">{question.question}</TableCell>
                      <TableCell>
                        {question.marked_unclear_at && new Date(question.marked_unclear_at).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))}

        {Object.keys(groupedQuestions).length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-lg text-slate-600 mb-2">
                Keine unklaren Fragen vorhanden
              </p>
              <p className="text-sm text-muted-foreground">
                Fragen können während des Trainings als unklar markiert werden
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default UnclearQuestions;