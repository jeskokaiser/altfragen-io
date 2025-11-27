import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Question } from '@/types/Question';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, X, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { UnclearQuestionsService } from '@/services/UnclearQuestionsService';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

const IgnoredQuestionsSection = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);

  const { data: questions, isLoading, error } = useQuery({
    queryKey: ['ignored-questions', user?.id],
    queryFn: async () => {
      if (!user) {
        return [];
      }

      // Get all ignored questions for this user
      const { data: unclearData, error: unclearError } = await supabase
        .from('user_ignored_questions')
        .select(`
          id,
          question_id,
          marked_unclear_at,
          created_at,
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
        .eq('user_id', user.id)
        .order('marked_unclear_at', { ascending: false });

      if (unclearError) {
        console.error('Error fetching ignored questions:', unclearError);
        throw unclearError;
      }

      if (!unclearData || unclearData.length === 0) {
        return [];
      }
      
      const filteredQuestions = unclearData
        ?.filter(item => !!item.questions)
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
    enabled: !!user && isOpen
  });

  const handleUnignore = async (questionId: string) => {
    try {
      const { error } = await UnclearQuestionsService.unmarkQuestionUnclear(questionId);
      if (error) throw error;

      toast.success('Frage wurde nicht mehr ignoriert');
      queryClient.invalidateQueries({ queryKey: ['ignored-questions'] });
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      queryClient.invalidateQueries({ queryKey: ['ignored-questions-count'] });
    } catch (error) {
      console.error('Error unignoring question:', error);
      toast.error('Fehler beim Entfernen der Ignorierung');
    }
  };

  return (
    <Card className="p-6">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <div className="flex items-center justify-between cursor-pointer">
            <div>
              <h2 className="text-xl font-semibold">Ignorierte Fragen</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Verwalte deine ignorierten Fragen. Ignorierte Fragen werden in Trainings übersprungen.
              </p>
            </div>
            <ChevronDown
              className={`h-5 w-5 text-muted-foreground transition-transform ${
                isOpen ? 'transform rotate-180' : ''
              }`}
            />
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Lädt ignorierte Fragen...</span>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-500">Fehler beim Laden der ignorierten Fragen</p>
              <p className="text-sm text-muted-foreground mt-2">
                {error instanceof Error ? error.message : 'Unbekannter Fehler'}
              </p>
            </div>
          ) : !questions || questions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                Keine ignorierten Fragen gefunden
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Markiere Fragen während des Trainings als ignoriert, um sie hier zu sehen.
              </p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[600px] overflow-y-auto">
              {questions.map((question) => (
                <Card key={question.id} className="border">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center justify-between">
                      <span className="truncate flex-1">
                        {question.filename || question.exam_name || 'Unbekannte Quelle'}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleUnignore(question.id)}
                        className="ml-2 h-8 w-8 p-0"
                        title="Nicht mehr ignorieren"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      <p className="text-sm text-slate-800 dark:text-slate-200 line-clamp-2">
                        {question.question}
                      </p>
                      <div className="grid gap-1 text-xs text-muted-foreground">
                        <p><strong>A:</strong> {question.optionA}</p>
                        <p><strong>B:</strong> {question.optionB}</p>
                        <p><strong>C:</strong> {question.optionC}</p>
                        <p><strong>D:</strong> {question.optionD}</p>
                        {question.optionE && <p><strong>E:</strong> {question.optionE}</p>}
                      </div>
                      <div className="pt-2 border-t text-xs text-muted-foreground">
                        <p><strong>Richtige Antwort:</strong> {question.correctAnswer}</p>
                        {question.comment && (
                          <p className="mt-1"><strong>Kommentar:</strong> {question.comment}</p>
                        )}
                        <p className="mt-1">
                          Ignoriert am: {new Date(question.marked_unclear_at!).toLocaleDateString('de-DE', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUnignore(question.id)}
                        className="w-full mt-2"
                      >
                        Nicht mehr ignorieren
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

export default IgnoredQuestionsSection;

