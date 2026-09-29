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
import { Question } from '@/types/Question';
import { TrainingSessionService } from '@/services/TrainingSessionService';
import { useUpcomingExam } from '@/hooks/useUpcomingExams';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ExamCohortComparisonSection } from '@/components/exams/ExamCohortComparisonSection';

const ExamAnalytics: React.FC = () => {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { subscribed } = useSubscription();
  const [isSubjectStatsOpen, setIsSubjectStatsOpen] = useState(true);
  const [groupingMode, setGroupingMode] = useState<'semester' | 'year' | 'filename'>('semester');

  // Fetch exam details
  const { data: exam, isLoading: isExamLoading } = useUpcomingExam(examId);

  // Fetch linked questions by exam_name. Keyed on the exam_name too, so that
  // relinking the exam refetches its questions.
  const { data: questions, isLoading: isQuestionsLoading } = useQuery({
    queryKey: ['exam-questions', examId, exam?.exam_name],
    queryFn: async () => {
      if (!exam?.exam_name) return [];

      // Split comma-separated exam_names
      const examNames = exam.exam_name
        .split(',')
        .map((n: string) => n.trim())
        .filter(Boolean);
      if (examNames.length === 0) return [];

      // Query questions directly by exam_name (any of the selected exam_names)
      const { data: questionData, error: questionsError } = await supabase
        .from('questions')
        .select('*')
        .in('exam_name', examNames);

      if (questionsError) throw questionsError;
      if (!questionData || questionData.length === 0) return [];

      // Map to Question type
      return questionData.map((q: any) => ({
        id: q.id,
        question: q.question,
        optionA: q.option_a,
        optionB: q.option_b,
        optionC: q.option_c,
        optionD: q.option_d,
        optionE: q.option_e,
        subject: q.subject,
        correctAnswer: q.correct_answer,
        comment: q.comment,
        filename: q.filename,
        difficulty: q.difficulty,
        is_unclear: q.is_unclear,
        marked_unclear_at: q.marked_unclear_at,
        university_id: q.university_id,
        visibility: (q.visibility as 'private' | 'university' | 'public') || 'private',
        user_id: q.user_id,
        semester: q.exam_semester || null,
        year: q.exam_year || null,
        image_key: q.image_key || null,
        show_image_after_answer: q.show_image_after_answer || false,
        exam_name: q.exam_name || null,
        created_at: q.created_at,
        question_case: q.question_case || null,
        case_text: q.case_text || null,
      })) as Question[];
    },
    enabled: !!exam,
  });

  // Fetch training sessions for this exam (needed to filter session progress)
  const { data: sessions } = useQuery({
    queryKey: ['exam-sessions', examId, user?.id],
    queryFn: async () => {
      if (!user?.id || !examId) return [];
      return TrainingSessionService.listForExam(user.id, examId);
    },
    enabled: !!user?.id && !!examId,
  });

  // Get session IDs for filtering progress
  const examSessionIds = sessions?.map((s) => s.id) || [];

  // Latest result per exam question, from the exam-linked sessions only
  const { data: mergedProgress, isLoading: isProgressLoading } = useQuery({
    queryKey: [
      'exam-progress',
      examId,
      user?.id,
      questions?.length,
      examSessionIds.sort().join(','),
    ],
    queryFn: async () => {
      if (!user?.id || !questions || questions.length === 0) {
        return new Map<string, boolean | null>();
      }
      return TrainingSessionService.fetchLatestResults(
        user.id,
        sessions?.map((s) => s.id) || [],
        questions.map((q) => q.id),
      );
    },
    enabled: !!user?.id && !!questions && questions.length > 0 && sessions !== undefined,
  });

  // Fetch session-specific progress for all training sessions
  const { data: sessionProgress } = useQuery({
    queryKey: ['exam-session-progress', examId, user?.id, sessions?.length],
    queryFn: async () => {
      if (!user?.id || !sessions || sessions.length === 0) return [];
      return TrainingSessionService.fetchProgress(
        user.id,
        sessions.map((s) => s.id),
      );
    },
    enabled: !!user?.id && !!sessions && sessions.length > 0,
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
        wrongPercentage: 0,
      };
    }

    const totalQuestions = questions.length;
    const answeredQuestions = mergedProgress.size;
    // Only count explicitly true as correct (null or false are not correct)
    const correctAnswers = [...mergedProgress.values()].filter(
      (isCorrect) => isCorrect === true,
    ).length;
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
      wrongPercentage,
    };
  }, [questions, mergedProgress]);

  // Calculate statistics by subject
  const subjectStats = useMemo(() => {
    if (!questions || !mergedProgress) return {};

    const stats: Record<string, { total: number; answered: number; correct: number }> = {};

    questions.forEach((q) => {
      if (!stats[q.subject]) {
        stats[q.subject] = { total: 0, answered: 0, correct: 0 };
      }
      stats[q.subject].total += 1;
    });

    mergedProgress.forEach((isCorrect, questionId) => {
      const question = questions.find((q) => q.id === questionId);
      if (question) {
        stats[question.subject].answered += 1;
        if (isCorrect) {
          stats[question.subject].correct += 1;
        }
      }
    });

    return Object.entries(stats)
      .sort(([, a], [, b]) => b.total - a.total)
      .reduce(
        (acc, [subject, stats]) => {
          acc[subject] = stats;
          return acc;
        },
        {} as Record<string, { total: number; answered: number; correct: number }>,
      );
  }, [questions, mergedProgress]);

  // Calculate per-session statistics
  const sessionStats = useMemo(() => {
    if (!sessions || !questions || !sessionProgress) return [];

    return sessions.map((session) => {
      const sessionQuestionIds = session.question_ids || [];
      const sessionQuestions = questions.filter((q) => sessionQuestionIds.includes(q.id));
      // One row per question and session: the table is unique on that pair.
      const sessionProgressData = sessionProgress.filter((p) => p.sessionId === session.id);

      const total = sessionQuestions.length;
      const answered = sessionProgressData.length;
      const correct = sessionProgressData.filter((p) => p.isCorrect === true).length;
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
        correctPercentage: answered ? (correct / answered) * 100 : 0,
      };
    });
  }, [sessions, questions, sessionProgress]);

  // Calculate statistics grouped by semester+year / year / filename
  const groupedStats = useMemo(() => {
    if (!questions || !mergedProgress) return [];

    type GroupKey = 'semester' | 'year' | 'filename';

    const field: GroupKey = groupingMode;

    const groups: Record<
      string,
      { label: string; total: number; answered: number; correct: number; year: number }
    > = {};

    questions.forEach((q) => {
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
          year: year,
        };
      }

      groups[key].total += 1;

      if (mergedProgress.has(q.id)) {
        groups[key].answered += 1;
        if (mergedProgress.get(q.id) === true) {
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
                <Progress
                  value={overallStats.answeredPercentage}
                  className="h-2 mb-2 dark:bg-zinc-800"
                >
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${overallStats.answeredPercentage}%` }}
                  />
                </Progress>
                <p className="text-sm text-muted-foreground">
                  {overallStats.answeredQuestions} von {overallStats.totalQuestions} Fragen
                  beantwortet ({overallStats.answeredPercentage.toFixed(0)}%)
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold text-green-600">
                  Richtige Antworten
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Progress
                  value={(overallStats.correctAnswers / overallStats.totalQuestions) * 100}
                  className="h-2 mb-2 bg-zinc-100 dark:bg-zinc-800"
                >
                  <div
                    className="h-full bg-green-600 transition-all"
                    style={{
                      width: `${(overallStats.correctAnswers / overallStats.totalQuestions) * 100}%`,
                    }}
                  />
                </Progress>
                <p className="text-sm text-muted-foreground">
                  {overallStats.correctAnswers} von {overallStats.totalQuestions} Fragen richtig (
                  {((overallStats.correctAnswers / overallStats.totalQuestions) * 100).toFixed(0)}%)
                  <br />
                  {overallStats.correctPercentage.toFixed(0)}% der beantworteten Fragen
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold text-red-600">
                  Falsche Antworten
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Progress
                  value={(overallStats.wrongAnswers / overallStats.totalQuestions) * 100}
                  className="h-2 mb-2 bg-zinc-100 dark:bg-zinc-800"
                >
                  <div
                    className="h-full bg-red-600 transition-all"
                    style={{
                      width: `${(overallStats.wrongAnswers / overallStats.totalQuestions) * 100}%`,
                    }}
                  />
                </Progress>
                <p className="text-sm text-muted-foreground">
                  {overallStats.wrongAnswers} von {overallStats.totalQuestions} Fragen falsch (
                  {((overallStats.wrongAnswers / overallStats.totalQuestions) * 100).toFixed(0)}%)
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Subject Statistics */}
          <Card>
            <Collapsible open={isSubjectStatsOpen} onOpenChange={setIsSubjectStatsOpen}>
              <CollapsibleTrigger className="flex items-center justify-between w-full p-4 hover:bg-muted/50 transition-colors">
                <h3 className="text-lg font-semibold">Statistik nach Fächern</h3>
                <ChevronDown
                  className={`h-4 w-4 transition-transform duration-200 ${isSubjectStatsOpen ? 'transform rotate-180' : ''}`}
                />
              </CollapsibleTrigger>
              <CollapsibleContent className="px-4 pb-4">
                {!subscribed && (
                  <div className="relative">
                    <div className="pointer-events-none select-none filter blur-sm opacity-70">
                      <div className="space-y-4">
                        {Object.entries(subjectStats)
                          .slice(0, 4)
                          .map(([subject, stats]) => (
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
                          Mit Premium siehst du auf einen Blick, in welchen Fächern du stark bist
                          und wo noch Lücken sind – perfekt, um deine Lernzeit gezielt zu planen.
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
            sessionStats.map((stat) => (
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
                        {stat.answered > 0 ? ((stat.wrong / stat.answered) * 100).toFixed(0) : 0}%
                        der beantworteten
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    {stat.status !== 'completed' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/training/session/${stat.id}`)}
                      >
                        Session fortsetzen
                      </Button>
                    )}
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => navigate(`/training/session/${stat.id}/analytics`)}
                    >
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
                  onValueChange={(value) =>
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
                      {groupedStats.slice(0, 4).map((group) => {
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
                      <Button size="sm" className="mt-1" onClick={() => navigate('/subscription')}>
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
                      {groupedStats.map((group) => {
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
