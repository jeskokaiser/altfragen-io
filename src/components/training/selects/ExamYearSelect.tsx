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

interface ExamYearSelectProps {
  form: UseFormReturn<FormValues>;
  years: string[];
  disabled?: boolean;
}

const ExamYearSelect: React.FC<ExamYearSelectProps> = ({ form, years, disabled }) => {
  return (
    <FormField
      control={form.control}
      name="examYear"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Prüfungsjahr</FormLabel>
          <Select onValueChange={field.onChange} defaultValue={field.value} disabled={disabled}>
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Alle Jahre" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              <SelectItem value="all">Alle Jahre</SelectItem>
              {[...years]
                .slice()
                .sort((a, b) => parseInt(b) - parseInt(a))
                .map((year) => (
                  <SelectItem key={year} value={year}>
                    {year}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </FormItem>
      )}
    />
  );
};

export default ExamYearSelect;

