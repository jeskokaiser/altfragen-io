import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Question } from '@/types/Question';
import ExamSubjectDistribution from './ExamSubjectDistribution';
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
import { ScrollArea } from "@/components/ui/scroll-area";

interface ExamConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  questions: Question[];
  onStartExam: (selectedQuestions: Question[]) => void;
}

interface FormValues {
  totalQuestions: string;
  distributions: Record<string, number>;
}

const ExamConfigModal: React.FC<ExamConfigModalProps> = ({
  isOpen,
  onClose,
  questions,
  onStartExam,
}) => {
  const form = useForm<FormValues>();
  const subjects = Array.from(new Set(questions.map(q => q.subject))).sort((a, b) => 
    a.localeCompare(b, 'de')
  );

  const handleSubmit = (values: FormValues) => {
    const totalQuestions = parseInt(values.totalQuestions);
    const distributions = values.distributions;
    
    const questionsBySubject = subjects.reduce((acc, subject) => {
      acc[subject] = questions.filter(q => q.subject === subject);
      return acc;
    }, {} as Record<string, Question[]>);

    const questionCounts = Object.entries(distributions).reduce((acc, [subject, percentage]) => {
      acc[subject] = Math.round((percentage / 100) * totalQuestions);
      return acc;
    }, {} as Record<string, number>);

    const selectedQuestions = Object.entries(questionCounts).flatMap(([subject, count]) => {
      const subjectQuestions = questionsBySubject[subject];
      return shuffle(subjectQuestions).slice(0, count);
    });

    onStartExam(shuffle(selectedQuestions));
    onClose();
  };

  const shuffle = <T,>(array: T[]): T[] => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Prüfungssimulation konfigurieren</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[60vh] pr-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="totalQuestions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gesamtanzahl der Fragen</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Wähle die Anzahl" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {[10, 20, 30, 40, 50].map((count) => (
                          <SelectItem key={count} value={count.toString()}>
                            {count} Fragen
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              
              <ExamSubjectDistribution
                subjects={subjects}
                form={form}
              />

              <div className="flex justify-end gap-4">
                <Button variant="outline" type="button" onClick={onClose}>
                  Abbrechen
                </Button>
                <Button type="submit">
                  Prüfung starten
                </Button>
              </div>
            </form>
          </Form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default ExamConfigModal;