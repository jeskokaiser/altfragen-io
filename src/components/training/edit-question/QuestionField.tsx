import React from 'react';
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { UseFormRegister } from 'react-hook-form';
import { FormData } from '../types/FormData';

interface QuestionFieldProps {
  register: UseFormRegister<FormData>;
}

export const QuestionField: React.FC<QuestionFieldProps> = ({ register }) => {
  return (
    <div>
      <Label htmlFor="question">Frage</Label>
      <Textarea id="question" {...register('question')} />
    </div>
  );
};