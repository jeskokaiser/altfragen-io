import React from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { UseFormRegister } from 'react-hook-form';
import { FormData } from '../types/FormData';

interface OptionsFieldsProps {
  register: UseFormRegister<FormData>;
}

export const OptionsFields: React.FC<OptionsFieldsProps> = ({ register }) => {
  return (
    <div className="grid grid-cols-1 gap-4">
      {['A', 'B', 'C', 'D', 'E'].map((option) => (
        <div key={option}>
          <Label htmlFor={`option${option}`}>Option {option}</Label>
          <Input id={`option${option}`} {...register(`option${option}` as keyof FormData)} />
        </div>
      ))}
    </div>
  );
};