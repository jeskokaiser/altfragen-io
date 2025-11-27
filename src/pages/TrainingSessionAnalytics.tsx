import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ArrowLeft, Play } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { fetchQuestionDetails } from '@/services/DatabaseService';
import { Question } from '@/types/Question';

const TrainingSessionAnalytics: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isSubjectStatsOpen, setIsSubjectStatsOpen] = useState(true);

  // Fetch session details
  const { data: session, isLoading: isSessionLoading } = useQuery({
    queryKey: ['training-session', sessionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('training_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!sessionId
  });

  // Fetch questions for this session
  const { data: questions, isLoading: isQuestionsLoading } = useQuery({
    queryKey: ['session-questions', sessionId],
    queryFn: async () => {
      if (!session || !session.question_ids || session.question_ids.length === 0) return [];
      const details = await fetchQuestionDetails(session.question_ids);
      return details as Question[];
    },
    enabled: !!session
  });

  // Fetch session-specific progress for questions
  const { data: userProgress, isLoading: isProgressLoading } = useQuery({
    queryKey: ['session-progress', sessionId, user?.id, questions?.length],
    queryFn: async () => {
      if (!user?.id || !questions || questions.length === 0 || !sessionId) return [];
      
      const questionIds = questions.map(q => q.id);
      const BATCH_SIZE = 300;
      const batches: string[][] = [];
      for (let i = 0; i < questionIds.length; i += BATCH_SIZE) {
        batches.push(questionIds.slice(i, i + BATCH_SIZE));
      }

      const batchPromises = batches.map(batch =>
        supabase
          .from('session_question_progress')
          .select('question_id, is_correct, updated_at, created_at')
          .eq('session_id', sessionId)
          .eq('user_id', user.id)
          .in('question_id', batch)
      );

      const results = await Promise.allSettled(batchPromises);
      const allProgress = results
        .filter(r => r.status === 'fulfilled')
        .flatMap((r: any) => r.value.data || []);

      return allProgress;
    },
    enabled: !!user?.id && !!questions && questions.length > 0 && !!sessionId
  });

  // Calculate statistics
  const stats = useMemo(() => {
    if (!questions || !userProgress) {
      return {
        totalQuestions: 0,
        answeredQuestions: 0,
        correctAnswers: 0,
        wrongAnswers: 0,
        answeredPercentage: 0,
        correctPercentage: 0,
        wrongPercentage: 0
      };
    }

    const totalQuestions = questions.length;
    const answeredQuestions = userProgress.length;
    const correctAnswers = userProgress.filter((p: any) => p.is_correct === true).length;
    const wrongAnswers = answeredQuestions - correctAnswers;

    const answeredPercentage = totalQuestions ? (answeredQuestions / totalQuestions) * 100 : 0;
    const correctPercentage = answeredQuestions ? (correctAnswers / answeredQuestions) * 100 : 0;
    const wrongPercentage = answeredQuestions ? (wrongAnswers / answeredQuestions) * 100 : 0;

    return {
      totalQuestions,
      answeredQuestions,
      correctAnswers,
      wrongAnswers,
      answeredPercentage,
      correctPercentage,
      wrongPercentage
    };
  }, [questions, userProgress]);

  // Calculate statistics by subject
  const subjectStats = useMemo(() => {
    if (!questions || !userProgress) return {};

    const stats: Record<string, { total: number; answered: number; correct: number }> = {};

    questions.forEach(q => {
      if (!stats[q.subject]) {
        stats[q.subject] = { total: 0, answered: 0, correct: 0 };
      }
      stats[q.subject].total += 1;
    });

    userProgress.forEach((progress: any) => {
      const question = questions.find(q => q.id === progress.question_id);
      if (question) {
        stats[question.subject].answered += 1;
        if (progress.is_correct) {
          stats[question.subject].correct += 1;
        }
      }
    });

    return Object.entries(stats)
      .sort(([, a], [, b]) => b.total - a.total)
      .reduce((acc, [subject, stats]) => {
        acc[subject] = stats;
        return acc;
      }, {} as Record<string, { total: number; answered: number; correct: number }>);
  }, [questions, userProgress]);

  if (isSessionLoading || isQuestionsLoading || isProgressLoading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div>Lade Statistiken...</div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="container mx-auto px-4 py-6">
        <Card>
          <CardContent className="py-8 text-center">
            <p>Session nicht gefunden</p>
            <Button onClick={() => navigate('/training/sessions')} className="mt-4">
              Zurück zu Sessions
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6 max-w-7xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/training/sessions')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{session.title}</h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
            <span>Status: {session.status}</span>
            <span>• {session.current_index + 1} / {session.total_questions} Fragen</span>
          </div>
        </div>
        {session.status !== 'completed' && (
          <Button onClick={() => navigate(`/training/session/${sessionId}`)}>
            <Play className="h-4 w-4 mr-2" />
            Session fortsetzen
          </Button>
        )}
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold">Gesamtfortschritt</CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={stats.answeredPercentage} className="h-2 mb-2 dark:bg-zinc-800">
              <div className="h-full bg-primary transition-all" style={{ width: `${stats.answeredPercentage}%` }} />
            </Progress>
            <p className="text-sm text-muted-foreground">
              {stats.answeredQuestions} von {stats.totalQuestions} Fragen beantwortet ({stats.answeredPercentage.toFixed(0)}%)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold text-green-600">Richtige Antworten</CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={(stats.correctAnswers / stats.totalQuestions) * 100} className="h-2 mb-2 bg-zinc-100 dark:bg-zinc-800">
              <div className="h-full bg-green-600 transition-all" style={{ width: `${(stats.correctAnswers / stats.totalQuestions) * 100}%` }} />
            </Progress>
            <p className="text-sm text-muted-foreground">
              {stats.correctAnswers} von {stats.totalQuestions} Fragen richtig ({((stats.correctAnswers / stats.totalQuestions) * 100).toFixed(0)}%)<br />
              {stats.correctPercentage.toFixed(0)}% der beantworteten Fragen
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold text-red-600">Falsche Antworten</CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={(stats.wrongAnswers / stats.totalQuestions) * 100} className="h-2 mb-2 bg-zinc-100 dark:bg-zinc-800">
              <div className="h-full bg-red-600 transition-all" style={{ width: `${(stats.wrongAnswers / stats.totalQuestions) * 100}%` }} />
            </Progress>
            <p className="text-sm text-muted-foreground">
              {stats.wrongAnswers} von {stats.totalQuestions} Fragen falsch ({((stats.wrongAnswers / stats.totalQuestions) * 100).toFixed(0)}%)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Subject Statistics */}
      <Card>
        <Collapsible open={isSubjectStatsOpen} onOpenChange={setIsSubjectStatsOpen}>
          <CollapsibleTrigger className="flex items-center justify-between w-full p-4 hover:bg-muted/50 transition-colors">
            <h3 className="text-lg font-semibold">Statistik nach Fächern</h3>
            <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isSubjectStatsOpen ? 'transform rotate-180' : ''}`} />
          </CollapsibleTrigger>
          <CollapsibleContent className="px-4 pb-4">
            <div className="space-y-4">
              {Object.entries(subjectStats).map(([subject, subjectStat]) => (
                <div key={subject} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{subject}</span>
                    <span className="text-sm text-muted-foreground">
                      {subjectStat.answered} / {subjectStat.total} beantwortet
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Progress 
                      value={(subjectStat.correct / subjectStat.total) * 100} 
                      className="flex-1 h-2 bg-zinc-100 dark:bg-zinc-800"
                    >
                      <div className="h-full bg-green-600 transition-all dark:bg-green-500/70" />
                    </Progress>
                    <span className="text-sm text-muted-foreground w-20 text-right">
                      {subjectStat.correct} richtig
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    </div>
  );
};

export default TrainingSessionAnalytics;

