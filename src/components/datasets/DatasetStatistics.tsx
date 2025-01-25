import React from 'react';
import { Question } from '@/types/Question';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';

interface DatasetStatisticsProps {
  questions: Question[];
}

const DatasetStatistics = ({ questions }: DatasetStatisticsProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: userProgress } = useQuery({
    queryKey: ['user-progress', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', user?.id);

      if (error) throw error;
      return data;
    },
    enabled: !!user
  });

  const totalQuestions = questions.length;
  const answeredQuestions = userProgress?.length || 0;
  const correctAnswers = userProgress?.filter(p => p.is_correct)?.length || 0;
  const wrongAnswers = answeredQuestions - correctAnswers;

  const answeredPercentage = (answeredQuestions / totalQuestions) * 100;
  const correctPercentage = (correctAnswers / totalQuestions) * 100;
  const wrongPercentage = (wrongAnswers / totalQuestions) * 100;

  const handleWrongQuestionsTraining = () => {
    // Get the IDs of questions that were answered incorrectly
    const wrongQuestionIds = userProgress
      ?.filter(p => !p.is_correct)
      .map(p => p.question_id) || [];

    // Filter the questions array to get only the wrong questions
    const wrongQuestions = questions.filter(q => 
      wrongQuestionIds.includes(q.id)
    );

    if (wrongQuestions.length === 0) {
      return;
    }

    // Store the wrong questions in localStorage and navigate to training
    localStorage.setItem('trainingQuestions', JSON.stringify(wrongQuestions));
    navigate('/training');
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div className="p-4 rounded-lg border bg-card text-card-foreground shadow-sm">
        <h3 className="text-lg font-semibold mb-2">Gesamtfortschritt</h3>
        <Progress value={answeredPercentage} className="h-2 mb-2" />
        <p className="text-sm text-muted-foreground">
          {answeredQuestions} von {totalQuestions} Fragen beantwortet
        </p>
      </div>
      
      <div className="p-4 rounded-lg border bg-card text-card-foreground shadow-sm">
        <h3 className="text-lg font-semibold mb-2 text-green-600">Richtige Antworten</h3>
        <Progress value={correctPercentage} className="h-2 mb-2 bg-green-100">
          <div className="h-full bg-green-600 transition-all" style={{ width: `${correctPercentage}%` }} />
        </Progress>
        <p className="text-sm text-muted-foreground">
          {correctAnswers} von {totalQuestions} Fragen richtig
        </p>
      </div>
      
      <div className="p-4 rounded-lg border bg-card text-card-foreground shadow-sm">
        <h3 className="text-lg font-semibold mb-2 text-red-600">Falsche Antworten</h3>
        <Progress value={wrongPercentage} className="h-2 mb-2 bg-red-100">
          <div className="h-full bg-red-600 transition-all" style={{ width: `${wrongPercentage}%` }} />
        </Progress>
        <p className="text-sm text-muted-foreground">
          {wrongAnswers} von {totalQuestions} Fragen falsch
        </p>
        {wrongAnswers > 0 && (
          <Button 
            onClick={handleWrongQuestionsTraining}
            variant="destructive"
            className="mt-2 w-full"
          >
            Falsche Fragen üben
          </Button>
        )}
      </div>
    </div>
  );
};

export default DatasetStatistics;