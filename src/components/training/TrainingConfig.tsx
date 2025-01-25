import React from 'react';
import { useForm } from 'react-hook-form';
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Question } from '@/types/Question';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from "@/hooks/use-toast";
import SubjectSelect from './selects/SubjectSelect';
import DifficultySelect from './selects/DifficultySelect';
import QuestionCountSelect from './selects/QuestionCountSelect';
import { FormValues } from './types/FormValues';

interface TrainingConfigProps {
  questions: Question[];
  onStart: (selectedQuestions: Question[]) => void;
}

const TrainingConfig: React.FC<TrainingConfigProps> = ({ questions, onStart }) => {
  const form = useForm<FormValues>({
    defaultValues: {
      subject: '',
      difficulty: '',
      questionCount: '',
    },
    mode: 'onChange',
  });

  const { user } = useAuth();
  const { toast } = useToast();

  const subjects = Array.from(new Set(questions.map(q => q.subject))).sort((a, b) => 
    a.localeCompare(b, 'de')
  );

  const handleSubmit = async (values: FormValues) => {
    let filteredQuestions = questions;
    
    if (values.subject !== 'all') {
      filteredQuestions = filteredQuestions.filter(q => q.subject === values.subject);
    }
    
    if (values.difficulty !== 'all') {
      const selectedDifficulty = parseInt(values.difficulty);
      // Filter out questions where difficulty is null or doesn't match
      filteredQuestions = filteredQuestions.filter(q => 
        q.difficulty !== null && q.difficulty === selectedDifficulty
      );
    }

    if (filteredQuestions.length === 0) {
      toast({
        title: "Keine Fragen verfügbar",
        description: "Mit den gewählten Filtereinstellungen sind keine Fragen verfügbar. Bitte passe deine Auswahl an.",
        variant: "destructive",
      });
      return;
    }
    
    const questionCount = values.questionCount === 'all' 
      ? filteredQuestions.length 
      : parseInt(values.questionCount);
    
    const { data: userProgress } = await supabase
      .from('user_progress')
      .select('question_id, is_correct')
      .eq('user_id', user?.id);

    const questionResults = new Map();
    userProgress?.forEach(progress => {
      questionResults.set(progress.question_id, progress.is_correct);
    });

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

    const prioritizedQuestions = [
      ...shuffle(untrained),
      ...shuffle(wrongAnswered),
      ...shuffle(correctAnswered)
    ].slice(0, questionCount);

    onStart(prioritizedQuestions);
  };

  const shuffle = <T,>(array: T[]): T[] => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };

  const isFormValid = form.watch('subject') && 
                     form.watch('difficulty') && 
                     (form.watch('questionCount') === 'all' || 
                      parseInt(form.watch('questionCount')) > 0);

  return (
    <div className="max-w-md mx-auto p-6">
      <h2 className="text-2xl font-semibold mb-6">Training konfigurieren</h2>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <SubjectSelect form={form} subjects={subjects} />
          <DifficultySelect form={form} />
          <QuestionCountSelect form={form} />
          <Button 
            type="submit" 
            className="w-full"
            disabled={!isFormValid}
          >
            Training starten
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default TrainingConfig;