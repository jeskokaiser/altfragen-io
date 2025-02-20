import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Question } from '@/types/Question';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { FormData } from './types/FormData';
import { QuestionField } from './edit-question/QuestionField';
import { OptionsFields } from './edit-question/OptionsFields';
import { SubjectField } from './edit-question/SubjectField';
import { DifficultyField } from './edit-question/DifficultyField';
interface EditQuestionModalProps {
  question: Question;
  isOpen: boolean;
  onClose: () => void;
  onQuestionUpdated: (updatedQuestion: Question) => void;
}
const EditQuestionModal: React.FC<EditQuestionModalProps> = ({
  question,
  isOpen,
  onClose,
  onQuestionUpdated
}) => {
  const {
    register,
    handleSubmit,
    formState: {
      isSubmitting
    },
    reset,
    setValue,
    watch
  } = useForm<FormData>();
  const correctAnswer = watch('correctAnswer');
  useEffect(() => {
    if (question) {
      reset({
        question: question.question,
        optionA: question.optionA,
        optionB: question.optionB,
        optionC: question.optionC,
        optionD: question.optionD,
        optionE: question.optionE,
        correctAnswer: question.correctAnswer,
        comment: question.comment,
        subject: question.subject,
        difficulty: question.difficulty?.toString() || '3'
      });
    }
  }, [question, reset]);
  const onSubmit = async (data: FormData) => {
    try {
      const {
        data: updatedQuestion,
        error
      } = await supabase.from('questions').update({
        question: data.question,
        option_a: data.optionA,
        option_b: data.optionB,
        option_c: data.optionC,
        option_d: data.optionD,
        option_e: data.optionE,
        correct_answer: data.correctAnswer,
        comment: data.comment,
        subject: data.subject,
        difficulty: parseInt(data.difficulty)
      }).eq('id', question.id).select().single();
      if (error) {
        console.error('Error updating question:', error);
        throw error;
      }
      if (updatedQuestion) {
        const mappedQuestion: Question = {
          id: updatedQuestion.id,
          question: updatedQuestion.question,
          optionA: updatedQuestion.option_a,
          optionB: updatedQuestion.option_b,
          optionC: updatedQuestion.option_c,
          optionD: updatedQuestion.option_d,
          optionE: updatedQuestion.option_e,
          correctAnswer: updatedQuestion.correct_answer,
          comment: updatedQuestion.comment,
          subject: updatedQuestion.subject,
          filename: updatedQuestion.filename,
          difficulty: updatedQuestion.difficulty
        };
        onQuestionUpdated(mappedQuestion);
        toast.info('Frage erfolgreich aktualisiert');
        onClose();
      }
    } catch (error: any) {
      console.error('Error updating question:', error);
      toast.error('Fehler beim Aktualisieren der Frage');
    }
  };
  const handleMoveToComment = () => {
    const currentComment = watch('comment') || '';
    setValue('comment', `${correctAnswer}\n${currentComment}`);
    setValue('correctAnswer', '');
  };
  return <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Frage bearbeiten</DialogTitle>
          <DialogDescription>Denke daran, die Änderungen zu speichern.</DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[calc(90vh-8rem)] pr-4">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <QuestionField register={register} />
            <OptionsFields register={register} />
            
            <div>
              <Label htmlFor="correctAnswer">Richtige Antwort</Label>
              <div className="flex gap-2">
                <Input id="correctAnswer" {...register('correctAnswer')} />
                <Button type="button" variant="outline" onClick={handleMoveToComment} size="icon" title="Antwort in Kommentar übernehmen">
                  ↓
                </Button>
              </div>
            </div>

            <DifficultyField defaultValue={question.difficulty?.toString() || '3'} onValueChange={value => setValue('difficulty', value)} />

            <div>
              <Label htmlFor="comment">Kommentar</Label>
              <Textarea id="comment" {...register('comment')} />
            </div>

            <SubjectField defaultValue={question.subject} onValueChange={value => setValue('subject', value)} />

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Abbrechen
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                Speichern
              </Button>
            </div>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>;
};
export default EditQuestionModal;