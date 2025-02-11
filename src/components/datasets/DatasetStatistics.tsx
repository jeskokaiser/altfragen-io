
import React from 'react';
import { Question } from '@/types/Question';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { useIsMobile } from '@/hooks/use-mobile';

interface DatasetStatisticsProps {
  questions: Question[];
}

const DatasetStatistics = ({ questions }: DatasetStatisticsProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = React.useState(true);
  const isMobile = useIsMobile();

  const { data: userProgress } = useQuery({
    queryKey: ['user-progress', user?.id, questions[0]?.filename],
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

  // Filter progress data to only include questions from this dataset
  const datasetQuestionIds = questions.map(q => q.id);
  const filteredProgress = userProgress?.filter(progress =>
    datasetQuestionIds.includes(progress.question_id)
  );

  const totalQuestions = questions.length;
  const answeredQuestions = filteredProgress?.length || 0;
  const correctAnswers = filteredProgress?.filter(p => p.is_correct)?.length || 0;
  const wrongAnswers = answeredQuestions - correctAnswers;

  const answeredPercentage = totalQuestions ? (answeredQuestions / totalQuestions) * 100 : 0;
  const correctPercentage = totalQuestions ? (correctAnswers / answeredQuestions) * 100 : 0;
  const wrongPercentage = totalQuestions ? (wrongAnswers / answeredQuestions) * 100 : 0;
  const correctPercentageBar = totalQuestions ? (correctAnswers / totalQuestions) * 100 : 0;
  const wrongPercentageBar = totalQuestions ? (wrongAnswers / totalQuestions) * 100 : 0;

  // Group questions by subject
  const subjectStats = React.useMemo(() => {
    const stats: Record<string, { total: number; answered: number; correct: number }> = {};

    // Initialize stats for each subject
    questions.forEach(q => {
      if (!stats[q.subject]) {
        stats[q.subject] = { total: 0, answered: 0, correct: 0 };
      }
      stats[q.subject].total += 1;
    });

    // Add progress stats for each subject
    filteredProgress?.forEach(progress => {
      const question = questions.find(q => q.id === progress.question_id);
      if (question) {
        stats[question.subject].answered += 1;
        if (progress.is_correct) {
          stats[question.subject].correct += 1;
        }
      }
    });

    // Convert to array and sort by total questions descending
    return Object.entries(stats)
      .sort(([, a], [, b]) => b.total - a.total)
      .reduce((acc, [subject, stats]) => {
        acc[subject] = stats;
        return acc;
      }, {} as Record<string, { total: number; answered: number; correct: number }>);
  }, [questions, filteredProgress]);

  const handleWrongQuestionsTraining = () => {
    // Get the IDs of questions that were answered incorrectly from this dataset
    const wrongQuestionIds = filteredProgress
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
    <div className={`space-y-4 ${isMobile ? 'px-2' : ''}`}>
      <div className={`grid grid-cols-1 ${isMobile ? 'gap-3' : 'md:grid-cols-3 gap-4'} mb-6`}>
        {/* Gesamtfortschritt */}
        <div className="p-3 rounded-lg border bg-card text-card-foreground shadow-sm">
          <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold mb-2`}>Gesamtfortschritt</h3>
          <div className="w-full">
            <Progress value={answeredPercentage} className="h-2 mb-2" />
          </div>
          <p className="text-sm text-muted-foreground">
            {answeredQuestions} von {totalQuestions} Fragen beantwortet ({answeredPercentage.toFixed(0)}%)
          </p>
        </div>
        
        {/* Richtige Antworten */}
        <div className="p-3 rounded-lg border bg-card text-card-foreground shadow-sm">
          <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold mb-2 text-green-600`}>Richtige Antworten</h3>
          <div className="w-full">
            <Progress value={correctPercentageBar} className="h-2 mb-2 bg-green-100">
              <div className="h-full bg-green-600 transition-all" style={{ width: `${correctPercentageBar}%` }} />
            </Progress>
          </div>
          <p className="text-sm text-muted-foreground">
            {correctAnswers} von {totalQuestions} Fragen richtig ({correctPercentageBar.toFixed(0)}%)<br />
            {correctPercentage.toFixed(0)}% der beantworteten Fragen
          </p>
        </div>
        
        {/* Falsche Antworten */}
        <div className="p-3 rounded-lg border bg-card text-card-foreground shadow-sm">
          <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold mb-2 text-red-600`}>Falsche Antworten</h3>
          <div className="w-full">
            <Progress value={wrongPercentageBar} className="h-2 mb-2 bg-red-100">
              <div className="h-full bg-red-600 transition-all" style={{ width: `${wrongPercentageBar}%` }} />
            </Progress>
          </div>
          <p className="text-sm text-muted-foreground">
            {wrongAnswers} von {totalQuestions} Fragen falsch ({wrongPercentageBar.toFixed(0)}%)
          </p>
          {wrongAnswers > 0 && (
            <Button 
              onClick={handleWrongQuestionsTraining}
              variant="destructive"
              className="mt-2 w-full"
              size={isMobile ? "sm" : "default"}
            >
              Falsche Fragen üben
            </Button>
          )}
        </div>
      </div>

      <Collapsible
        open={isOpen}
        onOpenChange={setIsOpen}
        className="border rounded-lg"
      >
        <CollapsibleTrigger className="flex items-center justify-between w-full p-3 hover:bg-muted/50 transition-colors">
          <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold`}>Statistik nach Fächern</h3>
          <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'transform rotate-180' : ''}`} />
        </CollapsibleTrigger>
        <CollapsibleContent className="px-3 pb-3">
          <div className="space-y-3">
            {Object.entries(subjectStats).map(([subject, stats]) => (
              <div key={subject} className="space-y-2">
                <div className="flex justify-between items-center flex-wrap gap-1">
                  <span className={`font-medium ${isMobile ? 'text-sm' : ''}`}>{subject}</span>
                  <span className="text-sm text-muted-foreground">
                    {stats.answered} / {stats.total} beantwortet
                  </span>
                </div>
                <div className="flex gap-2 items-center">
                  <div className="flex-1 min-w-0">
                    <Progress 
                      value={(stats.correct / stats.total) * 100} 
                      className="h-2 bg-green-100"
                    >
                      <div className="h-full bg-green-600 transition-all" />
                    </Progress>
                  </div>
                  <span className="text-sm text-muted-foreground whitespace-nowrap">
                    {stats.correct} richtig
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export default DatasetStatistics;
