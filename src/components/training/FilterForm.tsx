import React from 'react';
import { useForm } from 'react-hook-form';
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import SubjectSelect from './selects/SubjectSelect';
import DifficultySelect from './selects/DifficultySelect';
import QuestionCountSelect from './selects/QuestionCountSelect';
import { FormValues } from './types/FormValues';

interface FilterFormProps {
  subjects: string[];
  onSubmit: (values: FormValues) => void;
}

const FilterForm: React.FC<FilterFormProps> = ({ subjects, onSubmit }) => {
  const form = useForm<FormValues>({
    defaultValues: {
      subject: '',
      difficulty: '',
      questionCount: '',
    },
    mode: 'onChange',
  });

  const isFormValid = form.watch('subject') && 
                     form.watch('difficulty') && 
                     (form.watch('questionCount') === 'all' || 
                      parseInt(form.watch('questionCount')) > 0);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <SubjectSelect form={form} subjects={subjects} />
        <DifficultySelect form={form} />
        <QuestionCountSelect form={form} />
        <Button 
          type="submit" 
          className="w-full"
          disabled={!isFormValid}
        >
          Training starten
        </Button>
      </form>
    </Form>
  );
};

export default FilterForm;