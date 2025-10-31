import React, { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CalendarClock, Plus, Play, Settings, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { UpcomingExamWithStats } from '@/types/UpcomingExam';
import { getExamStatsForUser, type ExamUserStats } from '@/services/UpcomingExamService';
import { useTrainingSessions } from '@/hooks/useTrainingSessions';
import { useNavigate } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

function daysUntil(isoDate: string): number {
  const now = new Date();
  const target = new Date(isoDate);
  const diffMs = target.getTime() - now.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

interface UpcomingExamsListProps {
  exams: UpcomingExamWithStats[];
  onAddQuestions: (examId: string) => void;
  onStartTraining: (examId: string) => void;
  onDeleteExam?: (examId: string) => void;
  currentUserId?: string;
  onOpenAnalytics?: (examId: string) => void; // placeholder action
}

const UpcomingExamsList: React.FC<UpcomingExamsListProps> = ({ exams, onAddQuestions, onStartTraining, onDeleteExam, currentUserId, onOpenAnalytics }) => {
  const [stats, setStats] = useState<Record<string, ExamUserStats>>({});
  const navigate = useNavigate();

  const { sessions } = useTrainingSessions(currentUserId);

  // Load stats for all exams on mount
  useEffect(() => {
    if (!currentUserId || !exams || exams.length === 0) return;
    
    const loadAllStats = async () => {
      const statsPromises = exams.map(async (exam) => {
        try {
          const s = await getExamStatsForUser(exam.id, currentUserId);
          return { examId: exam.id, stats: s };
        } catch (e) {
          return null;
        }
      });
      
      const results = await Promise.all(statsPromises);
      const newStats: Record<string, ExamUserStats> = {};
      results.forEach(result => {
        if (result) {
          newStats[result.examId] = result.stats;
        }
      });
      setStats(newStats);
    };
    
    loadAllStats();
  }, [exams, currentUserId]);
  if (!exams || exams.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          Noch keine bevorstehenden Prüfungen. Lege eine neue an, um zu starten.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {exams.map((exam) => {
        const days = daysUntil(exam.due_date);
        const st = stats[exam.id];
        const sessionsForExam = (sessions || []).filter((s) => {
          const fs = s.filter_settings as any;
          return fs && fs.source === 'exam' && fs.examId === exam.id;
        });
        return (
          <Card
            key={exam.id}
            className={`group flex flex-col transition-all hover:shadow-md`}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center justify-between">
                <div className="text-left flex-1">
                  <span className="font-medium">{exam.title}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={days <= 3 ? 'destructive' : 'secondary'}>{days} Tage</Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="icon" variant="ghost" title="Einstellungen" className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onAddQuestions(exam.id)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Fragen verwalten
                      </DropdownMenuItem>
                      {onDeleteExam && (
                        <DropdownMenuItem 
                          onClick={() => onDeleteExam(exam.id)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Prüfung löschen
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col gap-3">
              <div className="flex items-center text-sm text-muted-foreground gap-2">
                <CalendarClock className="h-4 w-4" />
                <span>Fällig am {new Date(exam.due_date).toLocaleDateString()}</span>
              </div>
              {exam.subject && (
                <div className="text-sm">Fach: <span className="font-medium">{exam.subject}</span></div>
              )}
              <div className="text-sm">Verknüpfte Fragen: <span className="font-medium">{exam.linked_question_count}</span></div>

              <div className="grid grid-cols-3 gap-3 text-sm">
                <div className="p-2 rounded-md bg-muted/40">
                  <div className="text-muted-foreground">Beantwortet</div>
                  <div className="text-lg font-semibold">{st ? st.answered : '—'}</div>
                </div>
                <div className="p-2 rounded-md bg-muted/40">
                  <div className="text-muted-foreground">Richtig</div>
                  <div className="text-lg font-semibold">{st ? st.correct : '—'}</div>
                </div>
                <div className="p-2 rounded-md bg-muted/40">
                  <div className="text-muted-foreground">Quote</div>
                  <div className="text-lg font-semibold">{st ? `${st.percent_correct}%` : '—'}</div>
                </div>
              </div>

              <div className="mt-3 p-3 rounded-md border border-dashed text-sm">
                <div className="font-medium mb-1">Trainingssessions</div>
                {sessionsForExam.length > 0 ? (
                  <div className="space-y-2">
                    {sessionsForExam.slice(0, 3).map((s) => (
                      <div key={s.id} className="flex items-center justify-between">
                        <div className="min-w-0">
                          <div className="font-medium truncate">{s.title}</div>
                          <div className="text-xs text-muted-foreground">{s.current_index + 1}/{s.total_questions} • {s.status}</div>
                        </div>
                        <Button size="sm" variant="outline" onClick={() => navigate(`/training/session/${s.id}`)}>Fortsetzen</Button>
                      </div>
                    ))}
                    {sessionsForExam.length > 3 && (
                      <div className="text-xs text-muted-foreground">+ {sessionsForExam.length - 3} weitere</div>
                    )}
                  </div>
                ) : (
                  <div className="text-muted-foreground">Keine Sessions zu dieser Prüfung</div>
                )}
              </div>

              <div className="mt-auto flex gap-2">
                {exam.linked_question_count === 0 && (
                  <Button size="sm" onClick={() => onAddQuestions(exam.id)}>
                    <Plus className="h-4 w-4 mr-1" /> Fragen hinzufügen
                  </Button>
                )}
                <Button size="sm" variant="outline" onClick={() => onStartTraining(exam.id)} disabled={exam.linked_question_count === 0}>
                  <Play className="h-4 w-4 mr-1" /> Training starten
                </Button>
                <Button size="sm" variant="secondary" onClick={() => onOpenAnalytics ? onOpenAnalytics(exam.id) : undefined} disabled={!onOpenAnalytics}>
                  Auswertung
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default UpcomingExamsList;


