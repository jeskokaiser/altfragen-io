
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Question } from '@/types/Question';
import { FormValues } from './types/FormValues';
import FilterForm, { FilterFormRef } from './FilterForm';
import { filterQuestions, prioritizeQuestions } from '@/utils/questionFilters';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface TrainingConfigProps {
  questions: Question[];
  onStart: (selectedQuestions: Question[]) => void;
}

const TrainingConfig: React.FC<TrainingConfigProps> = ({ questions, onStart }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [questionResults, setQuestionResults] = useState<Map<string, boolean>>(new Map());
  const [attemptsCount, setAttemptsCount] = useState<Map<string, number>>(new Map());
  const { user } = useAuth();
  const formRef = useRef<FilterFormRef>(null);

  // Load user progress data
  useEffect(() => {
    if (user) {
      loadUserProgress();
    }
  }, [user]);

  const loadUserProgress = async () => {
    try {
      if (!user?.id) return;
      
      // Get question IDs in batches to avoid URL length limits
      const questionIds = questions.map(q => q.id);
      const BATCH_SIZE = 500;
      const resultsMap = new Map<string, boolean>();
      const attemptsMap = new Map<string, number>();
      
      // Process in batches
      for (let i = 0; i < questionIds.length; i += BATCH_SIZE) {
        const batch = questionIds.slice(i, i + BATCH_SIZE);
        
        const { data: progressData, error } = await supabase
          .from('user_progress')
          .select('question_id, is_correct, attempts_count')
          .eq('user_id', user.id)
          .in('question_id', batch);
        
        if (error) {
          console.error('Error loading user progress batch:', error);
          continue;
        }
        
        progressData?.forEach(progress => {
          if (progress.is_correct !== null) {
            resultsMap.set(progress.question_id, progress.is_correct);
          }
          if (progress.attempts_count !== null) {
            attemptsMap.set(progress.question_id, progress.attempts_count);
          }
        });
      }
      
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

  const handleStartTraining = () => {
    if (formRef.current) {
      formRef.current.submit();
    }
  };

  // Extract unique subjects and years from questions
  const subjects = Array.from(new Set(questions.map(q => q.subject).filter(Boolean)));
  const years = Array.from(new Set(questions.map(q => q.year).filter(Boolean)));

  return (
    <div className="space-y-6">
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Training konfigurieren</CardTitle>
        </CardHeader>
        <CardContent>
          <FilterForm 
            ref={formRef}
            subjects={subjects}
            years={years}
            onSubmit={onSubmit}
          />
          
          <Button 
            type="button" 
            className="w-full mt-6" 
            disabled={isProcessing}
            onClick={handleStartTraining}
          >
            {isProcessing ? 'Verarbeite...' : 'Training starten'}
          </Button>
        </CardContent>
      </Card>
      
      <div className="mb-6 p-4 bg-muted/50 rounded-lg text-sm text-muted-foreground max-w-2xl mx-auto">
        <p className="mb-2">
          Standardmäßig werden Fragen in dieser Reihenfolge ausgewählt:
        </p>
        <ol className="list-decimal ml-4 mb-3 space-y-1">
          <li>Noch nie beantwortete Fragen</li>
          <li>Falsch beantwortete Fragen</li>
          <li>Richtig beantwortete Fragen</li>
        </ol>
        <p>
          Du kannst die Auswahl anpassen durch:
        </p>
        <ul className="list-disc ml-4 space-y-1">
         <li>Filtern nach Fach, Schwierigkeitsgrad und Jahr</li>
          <li>Nur falsch beantwortete Fragen</li>
         <li>Nach Anzahl der Versuche sortieren
            <ul>
            <li>Jede Antwort zählt als ein Versuch (auch mehrere Versuche pro Frage)</li>
            </ul>
         </li>
          <li>Zufällige Auswahl aktivieren 
         <ul>
         <li>Ideal für Probeklausuren in Kombination mit benutzerdefinierter Anzahl</li>
          </ul>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default TrainingConfig;
