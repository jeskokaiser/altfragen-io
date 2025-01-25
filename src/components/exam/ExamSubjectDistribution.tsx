import React, { useEffect } from 'react';
import { UseFormReturn } from 'react-hook-form';
import {
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface ExamSubjectDistributionProps {
  subjects: string[];
  form: UseFormReturn<any>;
}

const ExamSubjectDistribution: React.FC<ExamSubjectDistributionProps> = ({
  subjects,
  form,
}) => {
  const validateDistributions = (values: Record<string, number>) => {
    const total = Object.values(values).reduce((sum, value) => sum + (value || 0), 0);
    if (Math.abs(total - 100) > 0.1) {
      toast.error("Die Summe der Prozentsätze muss 100% ergeben");
      return false;
    }
    return true;
  };

  useEffect(() => {
    // Initialize distributions with equal percentages
    const equalPercentage = Math.floor(100 / subjects.length);
    const remainder = 100 - (equalPercentage * subjects.length);
    
    const initialDistributions = subjects.reduce((acc, subject, index) => {
      acc[subject] = equalPercentage + (index === 0 ? remainder : 0);
      return acc;
    }, {} as Record<string, number>);

    form.setValue('distributions', initialDistributions);
  }, [subjects, form]);

  return (
    <div className="space-y-4">
      <h3 className="font-medium">Verteilung der Fächer</h3>
      {subjects.map((subject) => (
        <FormField
          key={subject}
          control={form.control}
          name={`distributions.${subject}`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{subject}</FormLabel>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="0"
                  max="100"
                  {...field}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 0;
                    field.onChange(value);
                    const currentValues = form.getValues('distributions');
                    validateDistributions(currentValues);
                  }}
                />
                <span className="text-sm text-gray-500">%</span>
              </div>
            </FormItem>
          )}
        />
      ))}
    </div>
  );
};

export default ExamSubjectDistribution;