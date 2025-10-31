import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
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

const ExamAnalytics: React.FC = () => {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isSubjectStatsOpen, setIsSubjectStatsOpen] = useState(true);

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

  // Fetch user progress for all exam questions
  const { data: userProgress, isLoading: isProgressLoading } = useQuery({
    queryKey: ['exam-progress', examId, user?.id, questions?.length],
    queryFn: async () => {
      if (!user?.id || !questions || questions.length === 0) return [];
      
      const questionIds = questions.map(q => q.id);
      const BATCH_SIZE = 300;
      const batches: string[][] = [];
      for (let i = 0; i < questionIds.length; i += BATCH_SIZE) {
        batches.push(questionIds.slice(i, i + BATCH_SIZE));
      }

      const batchPromises = batches.map(batch =>
        supabase
          .from('user_progress')
          .select('question_id, is_correct, updated_at, created_at')
          .eq('user_id', user.id)
          .in('question_id', batch)
      );

      const results = await Promise.allSettled(batchPromises);
      const allProgress = results
        .filter(r => r.status === 'fulfilled')
        .flatMap((r: any) => r.value.data || []);

      return allProgress;
    },
    enabled: !!user?.id && !!questions && questions.length > 0
  });

  // Fetch training sessions for this exam
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

  // Fetch session-specific progress for all training sessions
  const { data: sessionProgress } = useQuery({
    queryKey: ['exam-session-progress', examId, user?.id, sessions?.length],
    queryFn: async () => {
      if (!user?.id || !sessions || sessions.length === 0) return [];
      
      const sessionIds = sessions.map((s: any) => s.id);
      const { data, error } = await supabase
        .from('session_question_progress')
        .select('session_id, question_id, is_correct')
        .eq('user_id', user.id)
        .in('session_id', sessionIds);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id && !!sessions && sessions.length > 0
  });

  // Calculate overall statistics
  const overallStats = useMemo(() => {
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

  // Calculate per-session statistics
  const sessionStats = useMemo(() => {
    if (!sessions || !questions || !sessionProgress) return [];

    return sessions.map((session: any) => {
      const sessionQuestionIds = session.question_ids || [];
      const sessionQuestions = questions.filter(q => sessionQuestionIds.includes(q.id));
      const sessionProgressData = sessionProgress.filter((p: any) => p.session_id === session.id);

      const total = sessionQuestions.length;
      const answered = sessionProgressData.length;
      const correct = sessionProgressData.filter((p: any) => p.is_correct === true).length;
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
            <span>Fällig am {new Date(exam.due_date).toLocaleDateString()}</span>
            {exam.subject && <span>• {exam.subject}</span>}
          </div>
        </div>
      </div>

      <Tabs defaultValue="overall" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overall">Gesamtstatistik</TabsTrigger>
          <TabsTrigger value="sessions">Nach Sessions</TabsTrigger>
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
                    <Button variant="outline" size="sm" onClick={() => navigate(`/training/session/${stat.id}`)}>
                      Session fortsetzen
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => navigate(`/training/session/${stat.id}/analytics`)}>
                      Session-Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ExamAnalytics;

