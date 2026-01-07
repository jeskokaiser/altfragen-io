import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useTrainingSessions } from '@/hooks/useTrainingSessions';
import { useNavigate } from 'react-router-dom';
import { 
  GraduationCap, 
  BookOpen, 
  Play, 
  BarChart3, 
  Trash2, 
  CalendarClock,
  AlertCircle,
  Crown
} from 'lucide-react';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import type { UpcomingExam } from '@/types/UpcomingExam';

interface SessionWithExam {
  session: any;
  exam?: UpcomingExam;
  examDaysLeft?: number;
}

const TrainingSessionsList: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { subscribed } = useSubscription();
  const { sessions, isLoading, deleteSession } = useTrainingSessions(user?.id);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [sessionToDelete, setSessionToDelete] = useState<{ id: string; title: string } | null>(null);
  const [sessionsWithExams, setSessionsWithExams] = useState<SessionWithExam[]>([]);
  const [maxFreeSessions, setMaxFreeSessions] = useState<number>(10); // Default to 10 if not set in DB

  // Fetch max_free_sessions from database
  useEffect(() => {
    const fetchMaxFreeSessions = async () => {
      try {
        const { data, error } = await supabase
          .from('ai_commentary_settings')
          .select('max_free_sessions')
          .single();

        if (error) {
          console.error('Error fetching max_free_sessions:', error);
          // Keep default value of 10
        } else {
          // Use the value from DB if it's not null, otherwise keep default of 10
          // Type assertion needed as max_free_sessions may not be in generated types yet
          const maxSessions = (data as any)?.max_free_sessions;
          setMaxFreeSessions(maxSessions ?? 10);
        }
      } catch (error) {
        console.error('Error in fetchMaxFreeSessions:', error);
        // Keep default value of 10
      }
    };

    fetchMaxFreeSessions();
  }, []);

  // Fetch exam information for sessions
  useEffect(() => {
    const fetchExamData = async () => {
      if (!sessions || sessions.length === 0) {
        setSessionsWithExams([]);
        return;
      }

      const examSessions = sessions.filter((s) => {
        const fs = s.filter_settings as any;
        return fs && fs.source === 'exam' && fs.examId;
      });

      const examIds = examSessions.map((s: any) => (s.filter_settings as any).examId);
      
      if (examIds.length === 0) {
        setSessionsWithExams(sessions.map(s => ({ session: s })));
        return;
      }

      // Fetch exam details
      const { data: exams } = await (supabase as any)
        .from('upcoming_exams')
        .select('*')
        .in('id', examIds);

      const examMap = new Map<string, UpcomingExam>((exams || []).map((e: UpcomingExam) => [e.id, e]));

      const enhanced: SessionWithExam[] = sessions.map((session) => {
        const fs = session.filter_settings as any;
        if (fs && fs.source === 'exam' && fs.examId) {
          const exam = examMap.get(fs.examId) as UpcomingExam | undefined;
          if (exam) {
            const examDaysLeft = Math.ceil((new Date(exam.due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
            return { session, exam, examDaysLeft };
          }
        }
        return { session };
      });

      setSessionsWithExams(enhanced);
    };

    fetchExamData();
  }, [sessions]);

  const handleDeleteConfirm = async () => {
    if (!sessionToDelete) return;
    
    setDeletingId(sessionToDelete.id);
    try {
      await deleteSession(sessionToDelete.id);
    } finally {
      setDeletingId(null);
      setSessionToDelete(null);
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center py-8">Sessions werden geladen…</div>;
  }

  const totalSessions = sessions?.length || 0;
  const hasReachedLimit = !subscribed && totalSessions >= maxFreeSessions;

  // Group sessions by type
  const examSessions = sessionsWithExams.filter(s => s.exam);
  const generalSessions = sessionsWithExams.filter(s => !s.exam);

  return (
    <div className="space-y-6">
      {/* Session limit warning for free users */}
      {!subscribed && totalSessions >= 1 && (
        <Alert variant={hasReachedLimit ? "destructive" : "default"} className="border-2">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle className="flex items-center gap-2">
            {hasReachedLimit ? (
              <>Session-Limit erreicht ({totalSessions}/{maxFreeSessions})</>
            ) : (
              <>Noch {maxFreeSessions - totalSessions} Session{maxFreeSessions - totalSessions !== 1 ? 's' : ''} verfügbar ({totalSessions}/{maxFreeSessions})</>
            )}
          </AlertTitle>
          <AlertDescription className="mt-2">
            {hasReachedLimit ? (
              <div>
                <p className="mb-2">Du hast das kostenlose Limit von {maxFreeSessions} Trainingssessions erreicht. Lösche eine Session oder upgrade zu Premium für unbegrenzte Sessions.</p>
                <Button 
                  size="sm" 
                  variant="default"
                  onClick={() => navigate('/subscription')}
                >
                  <Crown className="h-4 w-4 mr-2" />
                  Jetzt Upgraden
                </Button>
              </div>
            ) : (
              <div>
                <p className="mb-2">Mit Premium erhältst du unbegrenzte Trainingssessions.</p>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => navigate('/subscription')}
                >
                  <Crown className="h-4 w-4 mr-2" />
                  Mehr erfahren
                </Button>
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Exam-based sessions */}
      {examSessions.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <GraduationCap className="h-4 w-4" />
            <span>Prüfungsbasierte Sessions ({examSessions.length})</span>
          </div>
          <div className="grid gap-4">
            {examSessions.map(({ session, exam, examDaysLeft }) => (
              <Card key={session.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base font-medium flex items-center gap-2 mb-1">
                        <GraduationCap className="h-4 w-4 flex-shrink-0 text-primary" />
                        <span className="truncate">{session.title}</span>
                      </CardTitle>
                      {exam && (
                        <div className="space-y-1">
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <span className="font-medium">Prüfung:</span>
                            <span>{exam.title}</span>
                          </div>
                          {exam.subject && (
                            <div className="text-xs text-muted-foreground">
                              Fach: {exam.subject}
                            </div>
                          )}
                          {examDaysLeft !== undefined && (
                            <div className="flex items-center gap-1 text-xs">
                              <CalendarClock className="h-3 w-3" />
                              <span className={examDaysLeft <= 3 ? "text-destructive font-semibold" : "text-muted-foreground"}>
                                {examDaysLeft > 0 ? `${examDaysLeft} Tage bis zur Prüfung` : 'Prüfung überfällig'}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge variant={session.status === 'completed' ? 'secondary' : session.status === 'active' ? 'default' : 'outline'}>
                        {session.status === 'completed' ? 'Abgeschlossen' : session.status === 'active' ? 'Aktiv' : 'Pausiert'}
                      </Badge>
                      {examDaysLeft !== undefined && examDaysLeft <= 3 && (
                        <Badge variant="destructive" className="text-xs">
                          Dringend
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between">
                    <div className="text-sm">
                      <span className="font-semibold">{session.current_index + 1}</span>
                      <span className="text-muted-foreground"> von </span>
                      <span className="font-semibold">{session.total_questions}</span>
                      <span className="text-muted-foreground"> Fragen</span>
                    </div>
                    <div className="flex gap-2">
                      {session.status !== 'completed' && (
                        <Button size="sm" variant="default" onClick={() => navigate(`/training/session/${session.id}`)}>
                          <Play className="h-3.5 w-3.5 mr-1" />
                          Fortsetzen
                        </Button>
                      )}
                      <Button size="sm" variant="outline" onClick={() => navigate(`/training/session/${session.id}/analytics`)}>
                        <BarChart3 className="h-3.5 w-3.5 mr-1" />
                        Auswertung
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        disabled={deletingId === session.id} 
                        onClick={() => setSessionToDelete({ id: session.id, title: session.title })}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* General training sessions */}
      {generalSessions.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <BookOpen className="h-4 w-4" />
            <span>Allgemeine Trainings-Sessions ({generalSessions.length})</span>
          </div>
          <div className="grid gap-4">
            {generalSessions.map(({ session }) => {
              const fs = session.filter_settings as any;
              return (
                <Card key={session.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base font-medium flex items-center gap-2 mb-1">
                          <BookOpen className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                          <span className="truncate">{session.title}</span>
                        </CardTitle>
                        <div className="text-sm text-muted-foreground space-y-1">
                          {(() => {
                            // Support both new subjects array and legacy subject string
                            const subjects = fs?.subjects && Array.isArray(fs.subjects) && fs.subjects.length > 0
                              ? fs.subjects
                              : (fs?.subject && fs.subject !== 'all' ? [fs.subject] : []);
                            
                            if (subjects.length > 0) {
                              return (
                                <div>Fach: <span className="font-medium">
                                  {subjects.length === 1 ? subjects[0] : `${subjects.length} Fächer`}
                                </span></div>
                              );
                            }
                            return null;
                          })()}
                          {fs?.difficulty && fs.difficulty !== 'all' && (
                            <div>Schwierigkeit: <span className="font-medium capitalize">{fs.difficulty}</span></div>
                          )}
                          {fs?.wrongQuestionsOnly && (
                            <Badge variant="outline" className="text-xs">Nur falsch beantwortete Fragen</Badge>
                          )}
                          {fs?.newQuestionsOnly && (
                            <Badge variant="outline" className="text-xs">Nur neue Fragen</Badge>
                          )}
                        </div>
                      </div>
                      <Badge variant={session.status === 'completed' ? 'secondary' : session.status === 'active' ? 'default' : 'outline'}>
                        {session.status === 'completed' ? 'Abgeschlossen' : session.status === 'active' ? 'Aktiv' : 'Pausiert'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between">
                      <div className="text-sm">
                        <span className="font-semibold">{session.current_index + 1}</span>
                        <span className="text-muted-foreground"> von </span>
                        <span className="font-semibold">{session.total_questions}</span>
                        <span className="text-muted-foreground"> Fragen</span>
                      </div>
                      <div className="flex gap-2">
                        {session.status !== 'completed' && (
                          <Button size="sm" variant="default" onClick={() => navigate(`/training/session/${session.id}`)}>
                            <Play className="h-3.5 w-3.5 mr-1" />
                            Fortsetzen
                          </Button>
                        )}
                        <Button size="sm" variant="outline" onClick={() => navigate(`/training/session/${session.id}/analytics`)}>
                          <BarChart3 className="h-3.5 w-3.5 mr-1" />
                          Auswertung
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          disabled={deletingId === session.id} 
                          onClick={() => setSessionToDelete({ id: session.id, title: session.title })}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {totalSessions === 0 && (
        <Card>
          <CardContent className="py-8 text-center">
            <BookOpen className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
            <p className="text-sm text-muted-foreground">Keine Sessions vorhanden.</p>
            <p className="text-xs text-muted-foreground mt-1">Erstelle eine neue Session, um zu starten.</p>
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!sessionToDelete} onOpenChange={(open) => !open && setSessionToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Session wirklich löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Möchtest du die Session "<span className="font-semibold">{sessionToDelete?.title}</span>" wirklich löschen? Dadurch wird auch der dazugehörige Lernfortschitt gelöscht.
              Diese Aktion kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TrainingSessionsList;
