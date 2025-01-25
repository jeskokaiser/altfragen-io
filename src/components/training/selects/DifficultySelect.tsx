import React from 'react';
import {
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { UseFormReturn } from 'react-hook-form';
import { FormValues } from '../types/FormValues';

interface DifficultySelectProps {
  form: UseFormReturn<FormValues>;
}

const DifficultySelect: React.FC<DifficultySelectProps> = ({ form }) => {
  const difficulties = [
    { value: "all", label: "Alle" },
    { value: "1", label: "Sehr leicht" },
    { value: "2", label: "Leicht" },
    { value: "3", label: "Mittel" },
    { value: "4", label: "Schwer" },
    { value: "5", label: "Sehr schwer" },
  ];

  return (
    <FormField
      control={form.control}
      name="difficulty"
      render={({ field }) => (
        <FormItem className="space-y-2">
          <FormLabel>Schwierigkeitsgrad</FormLabel>
          <ToggleGroup
            type="single"
            defaultValue={field.value}
            onValueChange={field.onChange}
            className="flex flex-wrap gap-2"
          >
            {difficulties.map((difficulty) => (
              <ToggleGroupItem
                key={difficulty.value}
                value={difficulty.value}
                aria-label={difficulty.label}
                className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
              >
                {difficulty.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </FormItem>
      )}
    />
  );
};

export default DifficultySelect;