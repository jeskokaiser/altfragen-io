
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Question } from '@/types/Question';
import { useUserPreferences } from '@/contexts/UserPreferencesContext';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { FormValues } from './types/FormValues';
import { filterQuestions, prioritizeQuestions } from '@/utils/questionFilters';
import FilterForm from './FilterForm';
import { toast } from 'sonner';
import { UnclearQuestionsService } from '@/services/UnclearQuestionsService';

interface TrainingConfigProps {
  questions: Question[];
  onStart: (selectedQuestions: Question[]) => void;
}

const TrainingConfig: React.FC<TrainingConfigProps> = ({ questions, onStart }) => {
  const { user } = useAuth();
  const { preferences } = useUserPreferences();

  const subjects = Array.from(new Set(questions.map(q => q.subject))).sort((a, b) => 
    a.localeCompare(b, 'de')
  );
  
  // Extract unique years from questions
  const years = Array.from(
    new Set(
      questions
        .filter(q => q.year)
        .map(q => q.year || '')
    )
  ).sort((a, b) => b.localeCompare(a)); // Sort years in descending order

  const handleSubmit = async (values: FormValues) => {
    console.log('Form values:', values);
    console.log('Total questions:', questions.length);
    
    // Get user progress data before filtering
    const { data: userProgress } = await supabase
      .from('user_progress')
      .select('question_id, is_correct, attempts_count')
      .eq('user_id', user?.id);

    // Create results map for filtering wrong questions
    const questionResults = new Map();
    userProgress?.forEach(progress => {
      questionResults.set(progress.question_id, progress.is_correct);
    });
    
    // Get user's unclear questions and filter them out
    const { data: unclearQuestions } = await UnclearQuestionsService.getUserUnclearQuestions();
    const unclearQuestionIds = new Set(unclearQuestions?.map(uq => uq.question_id) || []);
    
    // Filter out unclear questions first
    const questionsWithoutUnclear = questions.filter(q => !unclearQuestionIds.has(q.id));
    
    // Apply other filters
    const filteredQuestions = filterQuestions(questionsWithoutUnclear, values, questionResults);

    if (filteredQuestions.length === 0) {
      toast.error("Keine Fragen verfügbar", {
        description: "Mit den gewählten Filtereinstellungen sind keine Fragen verfügbar. Bitte passe deine Auswahl an."
      });
      return;
    }
    
    const questionCount = values.questionCount === 'all' 
      ? filteredQuestions.length 
      : parseInt(values.questionCount);
    
    // Create attempts count map for sorting
    const attemptsCount = new Map();
    userProgress?.forEach(progress => {
      attemptsCount.set(progress.question_id, progress.attempts_count || 0);
    });

    const prioritizedQuestions = prioritizeQuestions(
      filteredQuestions,
      questionResults,
      questionCount,
      values.isRandomSelection,
      values.sortByAttempts,
      attemptsCount,
      values.sortDirection
    );

    onStart(prioritizedQuestions);
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <h2 className="text-2xl font-semibold mb-4">Training konfigurieren</h2>
      
      <FilterForm 
        subjects={subjects}
        years={years}
        onSubmit={handleSubmit}
      />
      <br />
      <div className="mb-6 p-4 bg-muted/50 rounded-lg text-sm text-muted-foreground">
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
        <p className="mt-2 text-orange-600">
          <strong>Hinweis:</strong> Als unklar markierte Fragen werden automatisch ausgeblendet.
        </p>
      </div>
    </div>
  );
};

export default TrainingConfig;
