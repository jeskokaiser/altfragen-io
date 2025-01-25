import React from 'react';
import { Question } from '@/types/Question';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Progress } from "@/components/ui/progress";

interface DatasetStatisticsProps {
  questions: Question[];
}

const DatasetStatistics = ({ questions }: DatasetStatisticsProps) => {
  const { user } = useAuth();

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

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div className="p-4 rounded-lg border bg-card text-card-foreground shadow-sm">
        <h3 className="text-lg font-semibold mb-2">Total Progress</h3>
        <Progress value={answeredPercentage} className="h-2 mb-2" />
        <p className="text-sm text-muted-foreground">
          {answeredQuestions} of {totalQuestions} questions answered
        </p>
      </div>
      
      <div className="p-4 rounded-lg border bg-card text-card-foreground shadow-sm">
        <h3 className="text-lg font-semibold mb-2 text-green-600">Correct Answers</h3>
        <Progress value={correctPercentage} className="h-2 mb-2 bg-green-100">
          <div className="h-full bg-green-600 transition-all" style={{ width: `${correctPercentage}%` }} />
        </Progress>
        <p className="text-sm text-muted-foreground">
          {correctAnswers} of {totalQuestions} questions correct
        </p>
      </div>
      
      <div className="p-4 rounded-lg border bg-card text-card-foreground shadow-sm">
        <h3 className="text-lg font-semibold mb-2 text-red-600">Wrong Answers</h3>
        <Progress value={wrongPercentage} className="h-2 mb-2 bg-red-100">
          <div className="h-full bg-red-600 transition-all" style={{ width: `${wrongPercentage}%` }} />
        </Progress>
        <p className="text-sm text-muted-foreground">
          {wrongAnswers} of {totalQuestions} questions wrong
        </p>
      </div>
    </div>
  );
};

export default DatasetStatistics;