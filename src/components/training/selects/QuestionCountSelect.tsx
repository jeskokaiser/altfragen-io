import React from 'react';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UseFormReturn } from 'react-hook-form';
import { FormValues } from '../types/FormValues';

interface QuestionCountSelectProps {
  form: UseFormReturn<FormValues>;
}

const QuestionCountSelect: React.FC<QuestionCountSelectProps> = ({ form }) => {
  return (
    <FormField
      control={form.control}
      name="questionCount"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Anzahl der Fragen</FormLabel>
          <Select onValueChange={field.onChange} defaultValue={field.value}>
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Wähle die Anzahl" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              <SelectItem value="all">Alle Fragen</SelectItem>
              {[5, 10, 15, 20].map((count) => (
                <SelectItem key={count} value={count.toString()}>
                  {count} Fragen
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormItem>
      )}
    />
  );
};

export default QuestionCountSelect;