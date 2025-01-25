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
      form.setValue('questionCount', '');
    } else {
      setShowCustomInput(false);
      form.setValue('questionCount', value);
    }
  };

  const handleCustomInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow positive numbers
    if (/^\d*$/.test(value)) {
      form.setValue('questionCount', value);
    }
  };

  return (
    <FormField
      control={form.control}
      name="questionCount"
      render={({ field }) => (
        <FormItem className="space-y-2">
          <FormLabel>Anzahl der Fragen</FormLabel>
          <div className="space-y-2">
            <Select onValueChange={handleSelectChange} value={showCustomInput ? 'custom' : field.value}>
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
                placeholder="Geben Sie die gewünschte Anzahl ein"
                value={field.value}
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