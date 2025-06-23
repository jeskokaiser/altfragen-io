
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
import { fetchAllQuestions } from '@/services/DatabaseService';
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
      // Create a simple mock progress for now since we need to fix the immediate errors
      const resultsMap = new Map<string, boolean>();
      const attemptsMap = new Map<string, number>();
      
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

  // Extract unique subjects and years from questions
  const subjects = Array.from(new Set(questions.map(q => q.subject).filter(Boolean)));
  const years = Array.from(new Set(questions.map(q => q.year).filter(Boolean)));

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Training Konfiguration</CardTitle>
      </CardHeader>
      <CardContent>
        <FilterForm 
          subjects={subjects}
          years={years}
          onSubmit={onSubmit}
        />
        
        <Button 
          type="submit" 
          className="w-full mt-6" 
          disabled={isProcessing}
          onClick={form.handleSubmit(onSubmit)}
        >
          {isProcessing ? 'Verarbeite...' : 'Training starten'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default TrainingConfig;
