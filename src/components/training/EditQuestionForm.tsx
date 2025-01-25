import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Question } from '@/types/Question';
import { Button } from "@/components/ui/button";
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import EditQuestionFormFields from './EditQuestionFormFields';

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

interface EditQuestionFormProps {
  question: Question;
  onClose: () => void;
  onQuestionUpdated: (updatedQuestion: Question) => void;
}

const EditQuestionForm: React.FC<EditQuestionFormProps> = ({
  question,
  onClose,
  onQuestionUpdated,
}) => {
  const { register, handleSubmit, formState: { isSubmitting }, reset } = useForm<FormData>();

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
      });
    }
  }, [question, reset]);

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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <EditQuestionFormFields register={register} />
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Abbrechen
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          Speichern
        </Button>
      </div>
    </form>
  );
};

export default EditQuestionForm;