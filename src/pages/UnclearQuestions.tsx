import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Question } from '@/types/Question';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import EditQuestionModal from '@/components/training/EditQuestionModal';

const UnclearQuestions = () => {
  const { filename } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const { data: questions, isLoading } = useQuery({
    queryKey: ['unclear-questions', filename, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('user_id', user?.id)
        .eq('filename', decodeURIComponent(filename || ''))
        .eq('is_unclear', true);

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
        is_unclear: q.is_unclear,
        difficulty: q.difficulty,
        marked_unclear_at: q.marked_unclear_at
      })) as Question[];
    },
    enabled: !!user && !!filename
  });

  const handleRemoveUnclear = async (questionId: string) => {
    try {
      const { error } = await supabase
        .from('questions')
        .update({ is_unclear: false, marked_unclear_at: null })
        .eq('id', questionId);

      if (error) throw error;

      toast.success('Frage wurde aus der Liste entfernt');
      queryClient.invalidateQueries({ queryKey: ['unclear-questions'] });
      queryClient.invalidateQueries({ queryKey: ['questions'] });
    } catch (error) {
      console.error('Error removing unclear status:', error);
      toast.error('Fehler beim Entfernen der Frage');
    }
  };

  const handleEditClick = (question: Question) => {
    setSelectedQuestion(question);
    setIsEditModalOpen(true);
  };

  const handleQuestionUpdated = (updatedQuestion: Question) => {
    queryClient.invalidateQueries({ queryKey: ['unclear-questions'] });
    queryClient.invalidateQueries({ queryKey: ['questions'] });
  };

  if (isLoading) {
    return <div>Lädt...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-6">
        <Button
          variant="outline"
          onClick={() => navigate('/dashboard')}
          className="mb-4"
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Zurück
        </Button>
        <h1 className="text-2xl font-bold mb-2">
          Unklare Fragen - {decodeURIComponent(filename || '')}
        </h1>
        <p className="text-muted-foreground">
          {questions?.length || 0} unklare Fragen gefunden
        </p>
      </div>

      <div className="space-y-4">
        {questions?.map((question) => (
          <Card key={question.id}>
            <CardHeader>
              <CardTitle className="text-lg">Frage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-slate-800">{question.question}</p>
                <div className="grid gap-2">
                  <p><strong>A:</strong> {question.optionA}</p>
                  <p><strong>B:</strong> {question.optionB}</p>
                  <p><strong>C:</strong> {question.optionC}</p>
                  <p><strong>D:</strong> {question.optionD}</p>
                  <p><strong>E:</strong> {question.optionE}</p>
                </div>
                <div className="pt-4 border-t">
                  <p><strong>Richtige Antwort:</strong> {question.correctAnswer}</p>
                  {question.comment && (
                    <p className="mt-2"><strong>Kommentar:</strong> {question.comment}</p>
                  )}
                  <p className="text-sm text-muted-foreground mt-2">
                    Als unklar markiert am: {new Date(question.marked_unclear_at!).toLocaleDateString()}
                  </p>
                  <div className="flex gap-2 mt-4">
                    <Button 
                      variant="secondary"
                      onClick={() => handleRemoveUnclear(question.id)}
                    >
                      Entfernen
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleEditClick(question)}
                    >
                      Bearbeiten
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedQuestion && (
        <EditQuestionModal
          question={selectedQuestion}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onQuestionUpdated={handleQuestionUpdated}
        />
      )}
    </div>
  );
};

export default UnclearQuestions;