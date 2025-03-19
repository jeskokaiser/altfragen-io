
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

interface SubjectSelectProps {
  form: UseFormReturn<FormValues>;
  subjects: string[];
}

const SubjectSelect: React.FC<SubjectSelectProps> = ({ form, subjects }) => {
  // Filter out any empty subjects to prevent Select.Item error
  const validSubjects = subjects.filter(subject => subject && subject.trim() !== '');
  
  return (
    <FormField
      control={form.control}
      name="subject"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Fach auswählen</FormLabel>
          <Select onValueChange={field.onChange} defaultValue={field.value}>
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Wähle ein Fach" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              <SelectItem value="all">Alle Fächer</SelectItem>
              {validSubjects.map((subject) => (
                <SelectItem key={subject} value={subject}>
                  {subject || "Unbekannt"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormItem>
      )}
    />
  );
};

export default SubjectSelect;
