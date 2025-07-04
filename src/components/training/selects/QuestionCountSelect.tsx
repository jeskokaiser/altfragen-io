
import React, { useState } from 'react';
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
import { Input } from "@/components/ui/input";
import { UseFormReturn } from 'react-hook-form';
import { FormValues } from '../types/FormValues';

interface QuestionCountSelectProps {
  form: UseFormReturn<FormValues>;
}

const QuestionCountSelect: React.FC<QuestionCountSelectProps> = ({ form }) => {
  const [showCustomInput, setShowCustomInput] = useState(false);

  const handleSelectChange = (value: string) => {
    if (value === 'custom') {
      setShowCustomInput(true);
      form.setValue('questionCount', 1); // Set to minimum valid number
    } else if (value === 'all') {
      setShowCustomInput(false);
      form.setValue('questionCount', 9999); // Large number to represent "all"
    } else {
      setShowCustomInput(false);
      form.setValue('questionCount', parseInt(value)); // Convert string to number
    }
  };

  const handleCustomInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow positive numbers
    if (/^\d*$/.test(value) && value !== '') {
      form.setValue('questionCount', parseInt(value));
    } else if (value === '') {
      form.setValue('questionCount', 1); // Default to 1 if empty
    }
  };

  const currentValue = form.watch('questionCount');
  
  // Determine the select value based on current questionCount
  const getSelectValue = () => {
    if (showCustomInput) return 'custom';
    if (currentValue >= 9999) return 'all';
    if ([5, 10, 20, 50].includes(currentValue)) return currentValue.toString();
    return 'custom';
  };

  return (
    <FormField
      control={form.control}
      name="questionCount"
      render={({ field }) => (
        <FormItem className="space-y-2">
          <FormLabel>Anzahl der Fragen</FormLabel>
          <div className="space-y-2">
            <Select onValueChange={handleSelectChange} value={getSelectValue()}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Wähle die Anzahl" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="all">Alle Fragen</SelectItem>
                {[5, 10, 20, 50].map((count) => (
                  <SelectItem key={count} value={count.toString()}>
                    {count} Fragen
                  </SelectItem>
                ))}
                <SelectItem value="custom">Benutzerdefinierte Anzahl</SelectItem>
              </SelectContent>
            </Select>

            {showCustomInput && (
              <Input
                type="text"
                placeholder="Gewünschte Anzahl"
                value={currentValue >= 9999 ? '' : currentValue.toString()}
                onChange={handleCustomInputChange}
                className="mt-2"
              />
            )}
          </div>
        </FormItem>
      )}
    />
  );
};

export default QuestionCountSelect;
