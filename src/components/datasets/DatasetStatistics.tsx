
import React from 'react';
import { Question } from '@/types/Question';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";

interface DatasetStatisticsProps {
  questions: Question[];
}

const DatasetStatistics = ({ questions }: DatasetStatisticsProps) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = React.useState(() => {
    const saved = localStorage.getItem('statsCollapsibleState');
    return saved ? JSON.parse(saved) : true;
  });

  // Save to localStorage whenever isOpen changes
  React.useEffect(() => {
    localStorage.setItem('statsCollapsibleState', JSON.stringify(isOpen));
  }, [isOpen]);

  const { data: mergedProgress } = useQuery({
    queryKey: ['user-progress', user?.id, questions[0]?.filename],
    queryFn: async () => {
      if (!user?.id) return [];

      // Query both tables
      const [userProgressResult, sessionProgressResult] = await Promise.all([
        supabase
          .from('user_progress')
          .select('question_id, is_correct, updated_at, created_at')
          .eq('user_id', user.id),
        supabase
          .from('session_question_progress')
          .select('question_id, is_correct, updated_at, created_at')
          .eq('user_id', user.id)
      ]);

      if (userProgressResult.error) throw userProgressResult.error;
      if (sessionProgressResult.error) throw sessionProgressResult.error;

      // Merge progress: prioritize session_question_progress, take latest per question
      const progressMap = new Map<string, { question_id: string; is_correct: boolean | null; ts: number; source: 'session' | 'user' }>();

      // First, process session_question_progress (newer system, takes priority)
      (sessionProgressResult.data || []).forEach((p: any) => {
        if (!p.question_id) return;
        const ts = new Date(p.updated_at || p.created_at).getTime();
        const existing = progressMap.get(p.question_id);
        
        if (!existing || ts > existing.ts || (ts === existing.ts && existing.source === 'user')) {
          progressMap.set(p.question_id, {
            question_id: p.question_id,
            is_correct: p.is_correct,
            ts,
            source: 'session'
          });
        }
      });

      // Then, process user_progress for questions not already present or if newer
      (userProgressResult.data || []).forEach((p: any) => {
        if (!p.question_id) return;
        const ts = new Date(p.updated_at || p.created_at).getTime();
        const existing = progressMap.get(p.question_id);
        
        if (!existing || (ts > existing.ts && existing.source === 'session')) {
          // Only replace if significantly newer (session takes priority for equal timestamps)
          progressMap.set(p.question_id, {
            question_id: p.question_id,
            is_correct: p.is_correct,
            ts,
            source: 'user'
          });
        }
      });

      // Return simplified format
      return Array.from(progressMap.values()).map(({ question_id, is_correct }) => ({
        question_id,
        is_correct
      }));
    },
    enabled: !!user
  });

  // Filter progress data to only include questions from this dataset
  const datasetQuestionIds = questions.map(q => q.id);
  const filteredProgress = mergedProgress?.filter(progress =>
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

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Gesamtfortschritt */}
        <div className="p-4 rounded-lg border bg-card text-card-foreground shadow-sm">
          <h3 className="text-lg font-semibold mb-2">Gesamtfortschritt</h3>
          <Progress value={answeredPercentage} className="h-2 mb-2 dark:bg-zinc-800">
            <div className="h-full bg-primary transition-all dark:bg-zinc-400" style={{ width: `${answeredPercentage}%` }} />
          </Progress>
          <p className="text-sm text-muted-foreground">
            {answeredQuestions} von {totalQuestions} Fragen beantwortet ({answeredPercentage.toFixed(0)}%)
          </p>
        </div>
        
        {/* Richtige Antworten */}
        <div className="p-4 rounded-lg border bg-card text-card-foreground shadow-sm">
          <h3 className="text-lg font-semibold mb-2 text-green-600">Richtige Antworten</h3>
          <Progress value={correctPercentageBar} className="h-2 mb-2 bg-zinc-100 dark:bg-zinc-800">
            <div className="h-full bg-zinc-100 transition-all dark:bg-zinc-800" style={{ width: `${correctPercentageBar}%` }} />
          </Progress>
          <p className="text-sm text-muted-foreground">
            {correctAnswers} von {totalQuestions} Fragen richtig ({correctPercentageBar.toFixed(0)}%)<br />
            {correctPercentage.toFixed(0)}% der beantworteten Fragen
          </p>
        </div>
        
        {/* Falsche Antworten */}
        <div className="p-4 rounded-lg border bg-card text-card-foreground shadow-sm">
          <h3 className="text-lg font-semibold mb-2 text-red-600">Falsche Antworten</h3>
          <Progress value={wrongPercentageBar} className="h-2 mb-2 bg-zinc-100 dark:bg-zinc-800">
            <div className="h-full bg-zinc-100 transition-all dark:bg-zinc-800" style={{ width: `${wrongPercentageBar}%` }} />
          </Progress>
          <p className="text-sm text-muted-foreground">
            {wrongAnswers} von {totalQuestions} Fragen falsch ({wrongPercentageBar.toFixed(0)}%)
          </p>
        </div>
      </div>

      <Collapsible
        open={isOpen}
        onOpenChange={setIsOpen}
        className="border rounded-lg"
      >
        <CollapsibleTrigger className="flex items-center justify-between w-full p-4 hover:bg-muted/50 transition-colors">
          <h3 className="text-lg font-semibold">Statistik nach Fächern</h3>
          <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'transform rotate-180' : ''}`} />
        </CollapsibleTrigger>
        <CollapsibleContent className="px-4 pb-4">
          <div className="space-y-4">
            {Object.entries(subjectStats).map(([subject, stats]) => (
              <div key={subject} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium">{subject}</span>
                  <span className="text-sm text-muted-foreground">
                    {stats.answered} / {stats.total} beantwortet
                  </span>
                </div>
                <div className="flex gap-2">
                  <Progress 
                    value={(stats.correct / stats.total) * 100} 
                    className="flex-1 h-2 bg-zinc-100 dark:bg-zinc-800"
                  >
                    <div className="h-full bg-green-600 transition-all dark:bg-green-500/70" />
                  </Progress>
                  <span className="text-sm text-muted-foreground w-20 text-right">
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
