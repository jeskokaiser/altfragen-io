import React from 'react';
import { useForm } from 'react-hook-form';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Question } from '@/types/Question';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface EditQuestionModalProps {
  question: Question;
  isOpen: boolean;
  onClose: () => void;
  onQuestionUpdated: (updatedQuestion: Question) => void;
}

interface FormData {
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  optionE: string;
  correctAnswer: string;
  comment: string;
  subject: string;
}

const EditQuestionModal: React.FC<EditQuestionModalProps> = ({
  question,
  isOpen,
  onClose,
  onQuestionUpdated,
}) => {
  const { register, handleSubmit, formState: { isSubmitting } } = useForm<FormData>({
    defaultValues: {
      question: question.question,
      optionA: question.optionA,
      optionB: question.optionB,
      optionC: question.optionC,
      optionD: question.optionD,
      optionE: question.optionE,
      correctAnswer: question.correctAnswer,
      comment: question.comment,
      subject: question.subject,
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      const { data: updatedQuestion, error } = await supabase
        .from('questions')
        .update({
          question: data.question,
          option_a: data.optionA,
          option_b: data.optionB,
          option_c: data.optionC,
          option_d: data.optionD,
          option_e: data.optionE,
          correct_answer: data.correctAnswer,
          comment: data.comment,
          subject: data.subject,
        })
        .eq('id', question.id)
        .select()
        .single();

      if (error) throw error;

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
        };
        
        onQuestionUpdated(mappedQuestion);
        toast.success('Frage erfolgreich aktualisiert');
        onClose();
      }
    } catch (error: any) {
      console.error('Error updating question:', error);
      toast.error('Fehler beim Aktualisieren der Frage');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Frage bearbeiten</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="question">Frage</Label>
            <Textarea id="question" {...register('question')} />
          </div>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label htmlFor="optionA">Option A</Label>
              <Input id="optionA" {...register('optionA')} />
            </div>
            <div>
              <Label htmlFor="optionB">Option B</Label>
              <Input id="optionB" {...register('optionB')} />
            </div>
            <div>
              <Label htmlFor="optionC">Option C</Label>
              <Input id="optionC" {...register('optionC')} />
            </div>
            <div>
              <Label htmlFor="optionD">Option D</Label>
              <Input id="optionD" {...register('optionD')} />
            </div>
            <div>
              <Label htmlFor="optionE">Option E</Label>
              <Input id="optionE" {...register('optionE')} />
            </div>
          </div>
          <div>
            <Label htmlFor="correctAnswer">Richtige Antwort</Label>
            <Input id="correctAnswer" {...register('correctAnswer')} />
          </div>
          <div>
            <Label htmlFor="comment">Kommentar</Label>
            <Textarea id="comment" {...register('comment')} />
          </div>
          <div>
            <Label htmlFor="subject">Fach</Label>
            <Input id="subject" {...register('subject')} />
          </div>
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Abbrechen
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              Speichern
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditQuestionModal;