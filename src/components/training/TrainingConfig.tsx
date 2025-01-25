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
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface TrainingConfigProps {
  questions: Question[];
  onStart: (selectedQuestions: Question[]) => void;
}

interface FormValues {
  subject: string;
  questionCount: string;
  difficulty: string;
}

const TrainingConfig: React.FC<TrainingConfigProps> = ({ questions, onStart }) => {
  const form = useForm<FormValues>();
  const { user } = useAuth();

  // Get unique subjects from questions and sort them alphabetically
  const subjects = Array.from(new Set(questions.map(q => q.subject))).sort((a, b) => 
    a.localeCompare(b, 'de')  // Using German locale for proper sorting of umlauts
  );

  const handleSubmit = async (values: FormValues) => {
    // Filter questions by subject and difficulty
    let filteredQuestions = questions;
    
    if (values.subject !== 'all') {
      filteredQuestions = filteredQuestions.filter(q => q.subject === values.subject);
    }
    
    if (values.difficulty !== 'all') {
      const selectedDifficulty = parseInt(values.difficulty);
      filteredQuestions = filteredQuestions.filter(q => q.difficulty === selectedDifficulty);
    }
    
    const questionCount = parseInt(values.questionCount);
    
    // Get user's progress for these questions
    const { data: userProgress } = await supabase
      .from('user_progress')
      .select('question_id, is_correct')
      .eq('user_id', user?.id);

    // Create a map of question results
    const questionResults = new Map();
    userProgress?.forEach(progress => {
      questionResults.set(progress.question_id, progress.is_correct);
    });

    // Sort questions into three categories
    const untrained: Question[] = [];
    const wrongAnswered: Question[] = [];
    const correctAnswered: Question[] = [];

    filteredQuestions.forEach(question => {
      const result = questionResults.get(question.id);
      if (result === undefined) {
        untrained.push(question);
      } else if (result === false) {
        wrongAnswered.push(question);
      } else {
        correctAnswered.push(question);
      }
    });

    // Combine questions in priority order: untrained + wrong + correct
    const prioritizedQuestions = [
      ...shuffle(untrained),
      ...shuffle(wrongAnswered),
      ...shuffle(correctAnswered)
    ].slice(0, questionCount);

    onStart(prioritizedQuestions);
  };

  // Fisher-Yates shuffle algorithm
  const shuffle = <T,>(array: T[]): T[] => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
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
                    <SelectItem value="all">Alle Fächer</SelectItem>
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
            name="difficulty"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Schwierigkeitsgrad</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Wähle einen Schwierigkeitsgrad" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="all">Alle Schwierigkeitsgrade</SelectItem>
                    {[1, 2, 3, 4, 5].map((level) => (
                      <SelectItem key={level} value={level.toString()}>
                        {level} {level === 1 ? '(Sehr leicht)' : level === 5 ? '(Sehr schwer)' : ''}
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
