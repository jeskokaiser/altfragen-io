
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Question } from '@/types/Question';
import { FormData } from './types/FormData';
import { FormValues } from './types/FormValues';
import FilterForm from './FilterForm';
import { filterQuestions, prioritizeQuestions } from '@/utils/questionFilters';
import { DatabaseService } from '@/services/DatabaseService';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const formSchema = z.object({
  subject: z.string(),
  difficulty: z.string(),
  questionCount: z.coerce.number().min(1).max(100),
  wrongQuestionsOnly: z.boolean().default(false),
  isRandomSelection: z.boolean().default(false),
  yearRange: z.array(z.number()).length(2),
  sortByAttempts: z.boolean().default(false),
  sortDirection: z.enum(['asc', 'desc']).default('desc'),
});

interface TrainingConfigProps {
  questions: Question[];
  onStart: (selectedQuestions: Question[]) => void;
}

const TrainingConfig: React.FC<TrainingConfigProps> = ({ questions, onStart }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [questionResults, setQuestionResults] = useState<Map<string, boolean>>(new Map());
  const [attemptsCount, setAttemptsCount] = useState<Map<string, number>>(new Map());
  const { user } = useAuth();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      subject: 'all',
      difficulty: 'all',
      questionCount: 20,
      wrongQuestionsOnly: false,
      isRandomSelection: false,
      yearRange: [2020, 2024],
      sortByAttempts: false,
      sortDirection: 'desc',
    },
  });

  // Load user progress data
  useEffect(() => {
    if (user) {
      loadUserProgress();
    }
  }, [user]);

  const loadUserProgress = async () => {
    try {
      const progress = await DatabaseService.getUserProgress(user!.id);
      
      const resultsMap = new Map<string, boolean>();
      const attemptsMap = new Map<string, number>();
      
      progress.forEach(p => {
        if (p.question_id) {
          resultsMap.set(p.question_id, p.is_correct || false);
          attemptsMap.set(p.question_id, p.attempts_count || 1);
        }
      });
      
      setQuestionResults(resultsMap);
      setAttemptsCount(attemptsMap);
    } catch (error) {
      console.error('Error loading user progress:', error);
    }
  };

  const onSubmit = async (values: FormValues) => {
    setIsProcessing(true);
    
    try {
      const filteredQuestions = await filterQuestions(questions, values, questionResults);
      
      if (filteredQuestions.length === 0) {
        toast.error('Keine Fragen gefunden, die den Filterkriterien entsprechen.');
        setIsProcessing(false);
        return;
      }

      const prioritizedQuestions = prioritizeQuestions(
        filteredQuestions,
        questionResults,
        values.questionCount,
        values.isRandomSelection,
        values.sortByAttempts,
        attemptsCount,
        values.sortDirection
      );

      if (prioritizedQuestions.length === 0) {
        toast.error('Keine Fragen verfügbar für das Training.');
        setIsProcessing(false);
        return;
      }

      onStart(prioritizedQuestions);
    } catch (error) {
      console.error('Error filtering questions:', error);
      toast.error('Fehler beim Verarbeiten der Fragen');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Training Konfiguration</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FilterForm 
              form={form} 
              questions={questions}
              questionResults={questionResults}
              attemptsCount={attemptsCount}
            />
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isProcessing}
            >
              {isProcessing ? 'Verarbeite...' : 'Training starten'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default TrainingConfig;
