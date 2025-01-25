import React from 'react';
import { useForm } from 'react-hook-form';
import {
  Form,
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
import { Button } from "@/components/ui/button";
import { Question } from '@/types/Question';

interface TrainingConfigProps {
  questions: Question[];
  onStart: (selectedQuestions: Question[]) => void;
}

interface FormValues {
  subject: string;
  questionCount: string;
}

const TrainingConfig: React.FC<TrainingConfigProps> = ({ questions, onStart }) => {
  const form = useForm<FormValues>();

  // Get unique subjects from questions
  const subjects = Array.from(new Set(questions.map(q => q.subject)));

  const handleSubmit = (values: FormValues) => {
    const filteredQuestions = questions
      .filter(q => q.subject === values.subject)
      .slice(0, parseInt(values.questionCount));
    
    // Shuffle the questions
    const shuffledQuestions = [...filteredQuestions]
      .sort(() => Math.random() - 0.5);
    
    onStart(shuffledQuestions);
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <h2 className="text-2xl font-semibold mb-6">Training konfigurieren</h2>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
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
                    {subjects.map((subject) => (
                      <SelectItem key={subject} value={subject}>
                        {subject}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />

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

          <Button type="submit" className="w-full">
            Training starten
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default TrainingConfig;