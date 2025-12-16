import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ArrowLeft, Calendar } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getLinkedQuestionIdsForExam } from '@/services/UpcomingExamService';
import { fetchQuestionDetails } from '@/services/DatabaseService';
import { Question } from '@/types/Question';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { ExamCohortComparisonSection } from '@/components/exams/ExamCohortComparisonSection';

const ExamAnalytics: React.FC = () => {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const { user, universityId, universityName } = useAuth();
  const { subscribed } = useSubscription();
  const [isSubjectStatsOpen, setIsSubjectStatsOpen] = useState(true);
  const [groupingMode, setGroupingMode] = useState<'semester' | 'year' | 'filename'>('semester');

  // Fetch exam details
  const { data: exam, isLoading: isExamLoading } = useQuery({
    queryKey: ['exam', examId],
    queryFn: async () => {
      const sb: any = supabase;
      const { data, error } = await sb
        .from('upcoming_exams')
        .select('*')
        .eq('id', examId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!examId
  });

  // Fetch linked questions
  const { data: questions, isLoading: isQuestionsLoading } = useQuery({
    queryKey: ['exam-questions', examId],
    queryFn: async () => {
      if (!examId) return [];
      const links = await getLinkedQuestionIdsForExam(examId);
      const questionIds = links.map(l => l.question_id);
      if (questionIds.length === 0) return [];
      const details = await fetchQuestionDetails(questionIds);
      return details as Question[];
    },
    enabled: !!examId
  });

  // Fetch training sessions for this exam (needed to filter session progress)
  const { data: sessions } = useQuery({
    queryKey: ['exam-sessions', examId, user?.id],
    queryFn: async () => {
      if (!user?.id || !examId) return [];
      const { data, error } = await supabase
        .from('training_sessions')
        .select('*')
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      // Filter sessions that are linked to this exam
      return (data || []).filter((s: any) => {
        const fs = s.filter_settings as any;
        return fs && fs.source === 'exam' && fs.examId === examId;
      });
    },
    enabled: !!user?.id && !!examId
  });

  // Get session IDs for filtering progress
  const examSessionIds = sessions?.map((s: any) => s.id) || [];

  // Fetch session progress for all exam questions (only from exam-linked sessions)
  const { data: mergedProgress, isLoading: isProgressLoading } = useQuery({
    queryKey: ['exam-progress', examId, user?.id, questions?.length, examSessionIds.sort().join(',')],
    queryFn: async () => {
      if (!user?.id || !questions || questions.length === 0) return [];
      
      // Get current session IDs (in case they changed)
      const currentSessionIds = sessions?.map((s: any) => s.id) || [];
      
      const questionIds = questions.map(q => q.id);
      const BATCH_SIZE = 300;
      const batches: string[][] = [];
      for (let i = 0; i < questionIds.length; i += BATCH_SIZE) {
        batches.push(questionIds.slice(i, i + BATCH_SIZE));
      }

      // Query session progress only (no user_progress fallback)
      const batchPromises = batches.map(batch => {
        // Filter session progress to only include sessions linked to this exam
        if (currentSessionIds.length > 0) {
          return supabase
            .from('session_question_progress')
            .select('question_id, is_correct, updated_at, created_at')
            .eq('user_id', user.id)
            .in('question_id', batch)
            .in('session_id', currentSessionIds);
        } else {
          // If no exam sessions, return empty result
          return Promise.resolve({ data: [], error: null });
        }
      });

      const batchResults = await Promise.allSettled(batchPromises);
      
      // Process session_question_progress only
      const sessionProgress: Array<{ question_id: string; is_correct: boolean | null; ts: number }> = [];
      
      batchResults.forEach(result => {
        if (result.status === 'fulfilled') {
          const sessionProgressResult = result.value;
          
          // Process session_question_progress entries (take latest per question per batch)
          if (sessionProgressResult.data) {
            const sessionBatchMap = new Map<string, { is_correct: boolean | null; ts: number }>();
            sessionProgressResult.data.forEach((p: any) => {
              const qid = p.question_id as string;
              if (!qid) return;
              const ts = new Date(p.updated_at || p.created_at).getTime();
              const existing = sessionBatchMap.get(qid);
              if (!existing || ts > existing.ts) {
                sessionBatchMap.set(qid, { is_correct: p.is_correct, ts });
              }
            });
            sessionBatchMap.forEach((value, key) => {
              sessionProgress.push({ question_id: key, ...value });
            });
          }
        }
      });

      // Final deduplication across all batches to get the absolute latest per question
      const latestByQuestion: Record<string, { is_correct: boolean | null; ts: number }> = {};
      
      // Add all session progress and take the absolute latest per question
      sessionProgress.forEach(p => {
        const qid = p.question_id;
        const existing = latestByQuestion[qid];
        if (!existing || p.ts > existing.ts) {
          latestByQuestion[qid] = { is_correct: p.is_correct, ts: p.ts };
        }
      });

      // Convert to array format for compatibility
      return Object.entries(latestByQuestion).map(([question_id, data]) => ({
        question_id,
        is_correct: data.is_correct
      }));
    },
    enabled: !!user?.id && !!questions && questions.length > 0 && sessions !== undefined
  });

  // Fetch session-specific progress for all training sessions
  const { data: sessionProgress } = useQuery({
    queryKey: ['exam-session-progress', examId, user?.id, sessions?.length],
    queryFn: async () => {
      if (!user?.id || !sessions || sessions.length === 0) return [];
      
      const sessionIds = sessions.map((s: any) => s.id);
      const { data, error } = await supabase
        .from('session_question_progress')
        .select('session_id, question_id, is_correct, updated_at, created_at')
        .eq('user_id', user.id)
        .in('session_id', sessionIds);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id && !!sessions && sessions.length > 0
  });

  // Calculate overall statistics
  const overallStats = useMemo(() => {
    if (!questions || !mergedProgress) {
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
    const answeredQuestions = mergedProgress.length;
    // Only count explicitly true as correct (null or false are not correct)
    const correctAnswers = mergedProgress.filter((p: any) => p.is_correct === true).length;
    // Wrong = all answered minus correct (includes false and null)
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
  }, [questions, mergedProgress]);

  // Calculate statistics by subject
  const subjectStats = useMemo(() => {
    if (!questions || !mergedProgress) return {};

    const stats: Record<string, { total: number; answered: number; correct: number }> = {};

    questions.forEach(q => {
      if (!stats[q.subject]) {
        stats[q.subject] = { total: 0, answered: 0, correct: 0 };
      }
      stats[q.subject].total += 1;
    });

    mergedProgress.forEach((progress: any) => {
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
  }, [questions, mergedProgress]);

  // Calculate per-session statistics
  const sessionStats = useMemo(() => {
    if (!sessions || !questions || !sessionProgress) return [];

    return sessions.map((session: any) => {
      const sessionQuestionIds = session.question_ids || [];
      const sessionQuestions = questions.filter(q => sessionQuestionIds.includes(q.id));
      const sessionProgressData = sessionProgress.filter((p: any) => p.session_id === session.id);

      // Deduplicate by question_id, taking the latest entry per question
      const latestByQuestion: Record<string, { is_correct: boolean | null; ts: number }> = {};
      sessionProgressData.forEach((p: any) => {
        const qid = p.question_id;
        if (!qid) return;
        // Use updated_at or created_at, defaulting to 0 if neither exists
        const ts = p.updated_at ? new Date(p.updated_at).getTime() : (p.created_at ? new Date(p.created_at).getTime() : 0);
        const existing = latestByQuestion[qid];
        if (!existing || ts > existing.ts) {
          latestByQuestion[qid] = { is_correct: p.is_correct, ts };
        }
      });

      const total = sessionQuestions.length;
      const answered = Object.keys(latestByQuestion).length;
      const correct = Object.values(latestByQuestion).filter(v => v.is_correct === true).length;
      const wrong = answered - correct;

      return {
        id: session.id,
        title: session.title,
        status: session.status,
        total,
        answered,
        correct,
        wrong,
        answeredPercentage: total ? (answered / total) * 100 : 0,
        correctPercentage: answered ? (correct / answered) * 100 : 0
      };
    });
  }, [sessions, questions, sessionProgress]);

  // Calculate statistics grouped by semester+year / year / filename
  const groupedStats = useMemo(() => {
    if (!questions || !mergedProgress) return [];

    type GroupKey = 'semester' | 'year' | 'filename';

    const field: GroupKey = groupingMode;

    const latestByQuestion: Record<string, { is_correct: boolean | null }> = {};
    mergedProgress.forEach((p: any) => {
      latestByQuestion[p.question_id] = { is_correct: p.is_correct };
    });

    const groups: Record<
      string,
      { label: string; total: number; answered: number; correct: number; year: number }
    > = {};

    questions.forEach(q => {
      let key: string;
      let year: number;

      if (field === 'semester') {
        // Semester und Jahr immer als Einheit betrachten (z.B. \"SS 2025\")
        const sem = q.semester || 'Unbekanntes Semester';
        const yearStr = q.year || 'Unbekanntes Jahr';
        key = `${sem} ${yearStr}`.trim();
        // Extract year from year string (could be "2025" or "Unbekanntes Jahr")
        year = parseInt(yearStr) || 0;
      } else if (field === 'year') {
        key = q.year || 'Unbekanntes Jahr';
        year = parseInt(key) || 0;
      } else {
        key = q.filename || 'Unbekannte Klausur';
        // For filename mode, use the question's year
        year = parseInt(q.year || '0') || 0;
      }

      if (!groups[key]) {
        groups[key] = {
          label: key,
          total: 0,
          answered: 0,
          correct: 0,
          year: year
        };
      }

      groups[key].total += 1;

      const progress = latestByQuestion[q.id];
      if (progress) {
        groups[key].answered += 1;
        if (progress.is_correct === true) {
          groups[key].correct += 1;
        }
      }
    });

    return Object.values(groups).sort((a, b) => b.year - a.year);
  }, [questions, mergedProgress, groupingMode]);

  if (isExamLoading || isQuestionsLoading || isProgressLoading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div>Lade Statistiken...</div>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="container mx-auto px-4 py-6">
        <Card>
          <CardContent className="py-8 text-center">
            <p>Prüfung nicht gefunden</p>
            <Button onClick={() => navigate('/dashboard')} className="mt-4">
              Zurück zum Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6 max-w-7xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{exam.title}</h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
            <Calendar className="h-4 w-4" />
            <span>Prüfung am {new Date(exam.due_date).toLocaleDateString()}</span>
            {exam.subject && <span>• {exam.subject}</span>}
          </div>
        </div>
      </div>

      <Tabs defaultValue="overall" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overall">Gesamtstatistik</TabsTrigger>
          <TabsTrigger value="sessions">Nach Sessions</TabsTrigger>
          <TabsTrigger value="grouped">Nach Semester/Jahr/Klausur</TabsTrigger>
          <TabsTrigger value="cohort">Benchmarking</TabsTrigger>
        </TabsList>

        <TabsContent value="overall" className="space-y-6 mt-6">
          {/* Overall Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold">Gesamtfortschritt</CardTitle>
              </CardHeader>
              <CardContent>
                <Progress value={overallStats.answeredPercentage} className="h-2 mb-2 dark:bg-zinc-800">
                  <div className="h-full bg-primary transition-all" style={{ width: `${overallStats.answeredPercentage}%` }} />
                </Progress>
                <p className="text-sm text-muted-foreground">
                  {overallStats.answeredQuestions} von {overallStats.totalQuestions} Fragen beantwortet ({overallStats.answeredPercentage.toFixed(0)}%)
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold text-green-600">Richtige Antworten</CardTitle>
              </CardHeader>
              <CardContent>
                <Progress value={(overallStats.correctAnswers / overallStats.totalQuestions) * 100} className="h-2 mb-2 bg-zinc-100 dark:bg-zinc-800">
                  <div className="h-full bg-green-600 transition-all" style={{ width: `${(overallStats.correctAnswers / overallStats.totalQuestions) * 100}%` }} />
                </Progress>
                <p className="text-sm text-muted-foreground">
                  {overallStats.correctAnswers} von {overallStats.totalQuestions} Fragen richtig ({((overallStats.correctAnswers / overallStats.totalQuestions) * 100).toFixed(0)}%)<br />
                  {overallStats.correctPercentage.toFixed(0)}% der beantworteten Fragen
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold text-red-600">Falsche Antworten</CardTitle>
              </CardHeader>
              <CardContent>
                <Progress value={(overallStats.wrongAnswers / overallStats.totalQuestions) * 100} className="h-2 mb-2 bg-zinc-100 dark:bg-zinc-800">
                  <div className="h-full bg-red-600 transition-all" style={{ width: `${(overallStats.wrongAnswers / overallStats.totalQuestions) * 100}%` }} />
                </Progress>
                <p className="text-sm text-muted-foreground">
                  {overallStats.wrongAnswers} von {overallStats.totalQuestions} Fragen falsch ({((overallStats.wrongAnswers / overallStats.totalQuestions) * 100).toFixed(0)}%)
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
                {!subscribed && (
                  <div className="relative">
                    <div className="pointer-events-none select-none filter blur-sm opacity-70">
                      <div className="space-y-4">
                        {Object.entries(subjectStats).slice(0, 4).map(([subject, stats]) => (
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
                    </div>
                    <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
                      <div className="rounded-lg bg-background/90 shadow-md border px-4 py-3 max-w-xl space-y-2">
                        <p className="text-sm font-semibold flex items-center justify-center gap-2">
                          Detailierte Fach-Statistiken sind ein Premium-Feature.
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Mit Premium siehst du auf einen Blick, in welchen Fächern du stark bist und
                          wo noch Lücken sind – perfekt, um deine Lernzeit gezielt zu planen.
                        </p>
                        <Button
                          size="sm"
                          className="mt-1"
                          onClick={() => navigate('/subscription')}
                        >
                          Mehr über Premium erfahren
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {subscribed && (
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
                )}
              </CollapsibleContent>
            </Collapsible>
          </Card>
        </TabsContent>

        <TabsContent value="sessions" className="space-y-4 mt-6">
          {sessionStats.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Keine Trainingssessions für diese Prüfung vorhanden.
              </CardContent>
            </Card>
          ) : (
            sessionStats.map(stat => (
              <Card key={stat.id}>
                <CardHeader>
                  <CardTitle className="text-base flex items-center justify-between">
                    <span>{stat.title}</span>
                    <span className="text-sm font-normal text-muted-foreground">{stat.status}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <div className="text-sm text-muted-foreground">Fortschritt</div>
                      <Progress value={stat.answeredPercentage} className="h-2 dark:bg-zinc-800" />
                      <div className="text-sm">
                        {stat.answered} / {stat.total} ({stat.answeredPercentage.toFixed(0)}%)
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm text-muted-foreground">Richtig</div>
                      <div className="text-2xl font-bold text-green-600">{stat.correct}</div>
                      <div className="text-sm text-muted-foreground">
                        {stat.correctPercentage.toFixed(0)}% der beantworteten
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm text-muted-foreground">Falsch</div>
                      <div className="text-2xl font-bold text-red-600">{stat.wrong}</div>
                      <div className="text-sm text-muted-foreground">
                        {stat.answered > 0 ? ((stat.wrong / stat.answered) * 100).toFixed(0) : 0}% der beantworteten
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    {stat.status !== 'completed' && (
                      <Button variant="outline" size="sm" onClick={() => navigate(`/training/session/${stat.id}`)}>
                        Session fortsetzen
                      </Button>
                    )}
                    <Button variant="secondary" size="sm" onClick={() => navigate(`/training/session/${stat.id}/analytics`)}>
                      Session-Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="grouped" className="space-y-4 mt-6">
          <Card>
            <CardHeader className="pb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <CardTitle className="text-lg font-semibold">
                Statistik nach Semester / Jahr / Klausur
              </CardTitle>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Gruppierung:</span>
                <Select
                  value={groupingMode}
                  onValueChange={value =>
                    setGroupingMode(value as 'semester' | 'year' | 'filename')
                  }
                >
                  <SelectTrigger className="w-[220px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="semester">Nach Semester</SelectItem>
                    <SelectItem value="year">Nach Jahr</SelectItem>
                    <SelectItem value="filename">Nach Klausur/Dateiname</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {!subscribed && (
                <div className="relative">
                  <div className="pointer-events-none select-none filter blur-sm opacity-70">
                    <div className="space-y-3">
                      {groupedStats.slice(0, 4).map(group => {
                        const answeredPercentage = group.total
                          ? (group.answered / group.total) * 100
                          : 0;
                        const correctPercentage = group.answered
                          ? (group.correct / group.answered) * 100
                          : 0;

                        return (
                          <div
                            key={group.label}
                            className="p-3 rounded-md border bg-muted/40 space-y-2"
                          >
                            <div className="flex items-center justify-between text-sm">
                              <span className="font-medium">{group.label}</span>
                              <span className="text-muted-foreground">
                                {group.answered} / {group.total} beantwortet
                              </span>
                            </div>
                            <Progress
                              value={answeredPercentage}
                              className="h-1.5 bg-zinc-100 dark:bg-zinc-800"
                            />
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>Trefferquote: {correctPercentage.toFixed(0)}%</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
                    <div className="rounded-lg bg-background/90 shadow-md border px-4 py-3 max-w-xl space-y-2">
                      <p className="text-sm font-semibold flex items-center justify-center gap-2">
                        Detaillierte Klausur-Statistiken sind ein Premium-Feature.
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Mit Premium siehst du deine Trefferquoten pro Semester, Jahr und einzelner
                        Klausur, erkennst Lücken frühzeitig und kannst deine Vorbereitung gezielt
                        steuern.
                      </p>
                      <Button
                        size="sm"
                        className="mt-1"
                        onClick={() => navigate('/subscription')}
                      >
                        Mehr über Premium erfahren
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {subscribed && (
                <>
                  {groupedStats.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Für diese Prüfung liegen noch keine Statistikdaten vor.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {groupedStats.map(group => {
                        const answeredPercentage = group.total
                          ? (group.answered / group.total) * 100
                          : 0;
                        const correctPercentage = group.answered
                          ? (group.correct / group.answered) * 100
                          : 0;

                        return (
                          <div
                            key={group.label}
                            className="p-3 rounded-md border bg-card/60 space-y-2"
                          >
                            <div className="flex items-center justify-between text-sm">
                              <span className="font-medium">{group.label}</span>
                              <span className="text-muted-foreground">
                                {group.answered} / {group.total} beantwortet
                              </span>
                            </div>
                            <Progress
                              value={answeredPercentage}
                              className="h-1.5 bg-zinc-100 dark:bg-zinc-800"
                            />
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>Trefferquote: {correctPercentage.toFixed(0)}%</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cohort" className="space-y-4 mt-6">
          <ExamCohortComparisonSection
            examId={examId}
            examName={exam.exam_name ?? exam.title ?? null}
            subscribed={subscribed}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ExamAnalytics;

