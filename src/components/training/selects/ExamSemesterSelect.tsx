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

interface ExamSemesterSelectProps {
  form: UseFormReturn<FormValues>;
  disabled?: boolean;
}

const ExamSemesterSelect: React.FC<ExamSemesterSelectProps> = ({ form, disabled }) => {
  return (
    <FormField
      control={form.control}
      name="examSemester"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Semester</FormLabel>
          <Select onValueChange={field.onChange} defaultValue={field.value} disabled={disabled}>
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Alle Semester" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              <SelectItem value="all">Alle Semester</SelectItem>
              <SelectItem value="SS">Sommersemester (SS)</SelectItem>
              <SelectItem value="WS">Wintersemester (WS)</SelectItem>
            </SelectContent>
          </Select>
        </FormItem>
      )}
    />
  );
};

export default ExamSemesterSelect;

