
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Question } from '@/types/Question';
import { toast } from 'sonner';
import { FormData } from '@/components/training/types/FormData';
import { QuestionField } from '@/components/training/edit-question/QuestionField';
import { OptionsFields } from '@/components/training/edit-question/OptionsFields';
import { SubjectField } from '@/components/training/edit-question/SubjectField';
import { DifficultyField } from '@/components/training/edit-question/DifficultyField';
import { useUpdateQuestion } from '@/hooks/use-update-question';

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
  const { updateQuestion, isLoading } = useUpdateQuestion();
  
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
      const updatedQuestion = await updateQuestion({
        id: question.id,
        question: data.question,
        optionA: data.optionA,
        optionB: data.optionB,
        optionC: data.optionC,
        optionD: data.optionD,
        optionE: data.optionE,
        correctAnswer: data.correctAnswer,
        comment: data.comment,
        subject: data.subject,
        difficulty: parseInt(data.difficulty),
        filename: question.filename
      });
      
      onQuestionUpdated(updatedQuestion);
      toast.info('Frage erfolgreich aktualisiert');
      onClose();
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
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
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
              <Button type="submit" disabled={isSubmitting || isLoading}>
                Speichern
              </Button>
            </div>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default EditQuestionModal;
