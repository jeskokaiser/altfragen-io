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
import { UnclearQuestionsService } from '@/services/UnclearQuestionsService';

const UnclearQuestions = () => {
  const { filename } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const { data: questions, isLoading, error } = useQuery({
    queryKey: ['unclear-questions', filename, user?.id],
    queryFn: async () => {
      if (!user || !filename) {
        return [];
      }

      const decodedFilename = decodeURIComponent(filename);

      // Get unclear questions for this user
      const { data: unclearData, error: unclearError } = await supabase
        .from('user_unclear_questions')
        .select(`
          id,
          question_id,
          marked_unclear_at,
          questions:question_id (
            id,
            question,
            option_a,
            option_b,
            option_c,
            option_d,
            option_e,
            subject,
            correct_answer,
            comment,
            filename,
            difficulty,
            created_at,
            user_id,
            visibility,
            university_id,
            exam_semester,
            exam_year,
            image_key,
            show_image_after_answer,
            exam_name
          )
        `)
        .eq('user_id', user.id);

      if (unclearError) {
        console.error('Error fetching unclear questions:', unclearError);
        throw unclearError;
      }

      if (!unclearData || unclearData.length === 0) {
        return [];
      }
      
      const filteredQuestions = unclearData
        ?.filter(item => {
          const hasQuestions = !!item.questions;
          const questionFilename = item.questions?.filename;
          const questionExamName = item.questions?.exam_name;
          
          // Match either by filename or exam_name since datasets can be grouped by either
          const filenameMatch = questionFilename === decodedFilename;
          const examNameMatch = questionExamName === decodedFilename;
          const matches = filenameMatch || examNameMatch;
          
          return hasQuestions && matches;
        })
        .map(item => ({
          id: item.questions.id,
          question: item.questions.question,
          optionA: item.questions.option_a,
          optionB: item.questions.option_b,
          optionC: item.questions.option_c,
          optionD: item.questions.option_d,
          optionE: item.questions.option_e,
          subject: item.questions.subject,
          correctAnswer: item.questions.correct_answer,
          comment: item.questions.comment,
          filename: item.questions.filename,
          difficulty: item.questions.difficulty || 3,
          created_at: item.questions.created_at,
          user_id: item.questions.user_id,
          visibility: item.questions.visibility,
          university_id: item.questions.university_id,
          semester: item.questions.exam_semester,
          year: item.questions.exam_year,
          image_key: item.questions.image_key,
          show_image_after_answer: item.questions.show_image_after_answer,
          exam_name: item.questions.exam_name,
          is_unclear: true,
          marked_unclear_at: item.marked_unclear_at
        })) || [];

      return filteredQuestions as Question[];
    },
    enabled: !!user && !!filename
  });

  const handleRemoveUnclear = async (questionId: string) => {
    try {
      const { error } = await UnclearQuestionsService.unmarkQuestionUnclear(questionId);
      if (error) throw error;

      toast.success('Frage wurde aus der Liste entfernt');
      queryClient.invalidateQueries({ queryKey: ['unclear-questions'] });
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      queryClient.invalidateQueries({ queryKey: ['ignored-questions-count'] });
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
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Lädt ignorierte Fragen...</div>
        </div>
      </div>
    );
  }

  if (error) {
    console.error('Query error:', error);
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <Button
          variant="outline"
          onClick={() => navigate('/dashboard')}
          className="mb-4"
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Zurück
        </Button>
        <div className="text-center py-8">
          <p className="text-red-500">Fehler beim Laden der ignorierten Fragen</p>
          <p className="text-sm text-muted-foreground mt-2">
            {error instanceof Error ? error.message : 'Unbekannter Fehler'}
          </p>
        </div>
      </div>
    );
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
          Ignorierte Fragen - {decodeURIComponent(filename || '')}
        </h1>
        <p className="text-muted-foreground">
          {questions?.length || 0} ignorierte Fragen gefunden
        </p>
      </div>

      {!questions || questions.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-lg text-muted-foreground mb-4">
            Keine ignorierten Fragen für diese Datei gefunden
          </p>
          <p className="text-sm text-muted-foreground">
            Markiere Fragen während des Trainings als ignoriert, um sie hier zu sehen.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {questions.map((question) => (
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
                      Als ignoriert markiert am: {new Date(question.marked_unclear_at!).toLocaleDateString()}
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
      )}

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
