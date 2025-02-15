import React from 'react';
import { Question } from '@/types/Question';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from "@/hooks/use-toast";
import FilterForm from './FilterForm';
import { FormValues } from './types/FormValues';
import { filterQuestions, prioritizeQuestions } from '@/utils/questionFilters';

interface TrainingConfigProps {
  questions: Question[];
  onStart: (selectedQuestions: Question[]) => void;
}

const TrainingConfig: React.FC<TrainingConfigProps> = ({ questions, onStart }) => {
  const { user } = useAuth();
  const { toast } = useToast();

  const subjects = Array.from(new Set(questions.map(q => q.subject))).sort((a, b) => 
    a.localeCompare(b, 'de')
  );

  const handleSubmit = async (values: FormValues) => {
    console.log('Form values:', values);
    console.log('Total questions:', questions.length);
    
    const filteredQuestions = filterQuestions(questions, values);

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

    const prioritizedQuestions = prioritizeQuestions(
      filteredQuestions,
      questionResults,
      questionCount
    );

    onStart(prioritizedQuestions);
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <h2 className="text-2xl font-semibold mb-6">Training konfigurieren</h2>
      <FilterForm 
        subjects={subjects}
        onSubmit={handleSubmit}
      />
    </div>
  );
};

export default TrainingConfig;