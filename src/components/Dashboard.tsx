import React, { useState, useEffect, useCallback } from 'react';
import { Question } from '@/types/Question';
import { Link, useNavigate } from 'react-router-dom';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/contexts/AuthContext';
import FileUpload from './FileUpload';
import { useUserPreferences } from '@/contexts/UserPreferencesContext';
import { Calendar, ChevronDown, ListPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDashboardData } from '@/hooks/useDashboardData';
import { useUpcomingExams } from '@/hooks/useUpcomingExams';
import { useQueryClient } from '@tanstack/react-query';
import UpcomingExamCreateDialog from './exams/UpcomingExamCreateDialog';
import UpcomingExamEditDialog from './exams/UpcomingExamEditDialog';
import UpcomingExamsList from './exams/UpcomingExamsList';
import ExamQuestionSelectorDialog from './exams/ExamQuestionSelectorDialog';
import {
  deleteUpcomingExam,
  fetchQuestionsForExamNames,
  splitExamNames,
  updateUpcomingExam,
} from '@/services/UpcomingExamService';
import { fetchUserDifficultiesForQuestions } from '@/services/UserProgressService';
import { fetchIsPremium } from '@/services/ProfileService';
import {
  fetchPrivateAiCreditsRemaining,
  fetchPrivateAiUsedLast30Days,
} from '@/services/AICreditsService';
import { TrainingSessionService } from '@/services/TrainingSessionService';
import TrainingSessionCreateDialog from '@/components/training/TrainingSessionCreateDialog';
import { toast } from 'sonner';
import StatisticsDateRangeSelector from './datasets/StatisticsDateRangeSelector';
import { StatisticsDateRange } from '@/contexts/UserPreferencesContext';
import { supabase } from '@/integrations/supabase/client';
import { ErrorState, LoadingState } from '@/components/ds/States';
import { Page, PageHeader } from '@/components/ds/PageHeader';
import { StatTile } from '@/components/ds/StatTile';
import { Callout } from '@/components/ds/Callout';
import { Input } from '@/components/ui/input';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import ResumeSessionRow from '@/components/training/ResumeSessionRow';

const Dashboard = () => {
  const { user, universityId } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { preferences, updatePreferences } = useUserPreferences();
  const { exams, isLoading: isExamsLoading } = useUpcomingExams(user?.id);

  // State variables
  const [isCreateExamOpen, setIsCreateExamOpen] = useState(false);
  const [isEditExamOpen, setIsEditExamOpen] = useState(false);
  const [examToEdit, setExamToEdit] = useState<string | null>(null);
  const [isQuestionSelectorOpen, setIsQuestionSelectorOpen] = useState(false);
  const [examIdForLinking, setExamIdForLinking] = useState<string | null>(null);
  const [isCreateTrainingSessionOpen, setIsCreateTrainingSessionOpen] = useState(false);
  const [createSessionQuestions, setCreateSessionQuestions] = useState<Question[]>([]);
  const [createSessionDefaultTitle, setCreateSessionDefaultTitle] = useState<string>(
    `${new Date().toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })} – Training Session`,
  );
  const [createSessionExamId, setCreateSessionExamId] = useState<string | null>(null);

  // Private AI commentary quota & credits
  const [aiCreditsConsent, setAiCreditsConsent] = useState(false);
  const [aiCreditsLoading, setAiCreditsLoading] = useState(true);
  const [aiCreditsError, setAiCreditsError] = useState<string | null>(null);
  const [aiCredits, setAiCredits] = useState<{
    isPremium: boolean;
    monthStart: string;
    baseMonthlyFreeLimit: number;
    freeUsedCount: number;
    remainingFree: number;
    paidCreditsRemaining: number;
    totalRemaining: number;
    processingBlocked: boolean;
  } | null>(null);
  const [isCreatingCreditsCheckout, setIsCreatingCreditsCheckout] = useState(false);
  const [aiCreditsPacks, setAiCreditsPacks] = useState<number>(1);

  // Fetch all dashboard data
  const {
    isQuestionsLoading,
    questionsError,
    todayNewCount,
    todayPracticeCount,
    todayRepeatedCount,
    totalAnsweredCount,
    totalAttemptsCount,
  } = useDashboardData(user?.id, universityId, preferences?.statisticsDateRange);

  // Fetch private AI commentary quota / credit status
  useEffect(() => {
    const loadCredits = async () => {
      if (!user) {
        setAiCreditsLoading(false);
        return;
      }

      try {
        setAiCreditsLoading(true);
        setAiCreditsError(null);

        // The German message is what the user sees, so it stays here.
        const isPremium = await fetchIsPremium(user.id).catch(() => {
          throw new Error('Fehler beim Laden des Profils');
        });
        const BASE_MONTHLY_FREE_LIMIT = 100;

        // Calculate rolling 30-day window start (for display)
        const now = new Date();
        const windowStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .slice(0, 10);

        // Get usage from quota ledger (rolling 30 days) via RPC
        const used = await fetchPrivateAiUsedLast30Days(user.id).catch((usedError) => {
          console.error('Fehler beim Laden der Quota-Nutzung:', usedError);
          throw new Error('Fehler beim Laden der Quota-Nutzung');
        });
        const freeUsedCount = Math.max(0, Math.min(BASE_MONTHLY_FREE_LIMIT, used));
        const remainingFree = Math.max(0, BASE_MONTHLY_FREE_LIMIT - used);

        // Get remaining credits from credits ledger via RPC
        const creditsRemaining = await fetchPrivateAiCreditsRemaining(user.id).catch(
          (creditsError) => {
            console.error('Fehler beim Laden der Credits:', creditsError);
            throw new Error('Fehler beim Laden der Credits');
          },
        );

        const paidCreditsRemaining = Math.max(0, creditsRemaining);
        const totalRemaining = remainingFree + paidCreditsRemaining;
        const processingBlocked = !isPremium || totalRemaining <= 0;

        setAiCredits({
          isPremium,
          monthStart: windowStart,
          baseMonthlyFreeLimit: BASE_MONTHLY_FREE_LIMIT,
          freeUsedCount,
          remainingFree,
          paidCreditsRemaining,
          totalRemaining,
          processingBlocked,
        });
      } catch (err) {
        console.error('Unerwarteter Fehler beim Laden der AI-Credit-Übersicht:', err);
        setAiCreditsError(
          err instanceof Error
            ? err.message
            : 'Unerwarteter Fehler beim Laden der AI-Credit-Übersicht',
        );
      } finally {
        setAiCreditsLoading(false);
      }
    };

    loadCredits();
  }, [user?.id]);

  const handleBuyAiCredits = useCallback(async () => {
    if (!user || isCreatingCreditsCheckout || !aiCreditsConsent) return;

    try {
      setIsCreatingCreditsCheckout(true);

      const { data: session } = await supabase.auth.getSession();
      const accessToken = session.session?.access_token;
      if (!accessToken) {
        throw new Error('Keine gültige Session gefunden');
      }

      const packs = Math.max(1, Math.min(20, Math.floor(aiCreditsPacks || 1)));

      const { data, error } = await supabase.functions.invoke('create-ai-credits-checkout', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: {
          quantity: packs,
        },
      });

      if (error) {
        console.error('Fehler beim Erstellen der AI-Credit-Checkout-Session:', error);
        toast.error(error.message || 'Fehler beim Starten des Checkouts');
        return;
      }

      if (data?.url) {
        window.location.href = data.url;
      } else {
        toast.error('Keine Checkout-URL erhalten');
      }
    } catch (err) {
      console.error('Unerwarteter Fehler beim Starten des AI-Credit-Checkouts:', err);
      toast.error('Unerwarteter Fehler beim Starten des AI-Credit-Checkouts');
    } finally {
      setIsCreatingCreditsCheckout(false);
    }
  }, [user, isCreatingCreditsCheckout, aiCreditsPacks, aiCreditsConsent]);

  // Filter questions for personal datasets

  // Filter questions for university datasets

  // Group questions

  // Display filtered university datasets only if specific datasets are selected

  // Memoized event handlers

  const handleQuestionsLoaded = useCallback(() => {
    window.location.reload();
  }, []);

  const handleOpenCreateExam = useCallback(() => {
    setIsCreateExamOpen(true);
  }, []);

  const handleOpenEditExam = useCallback((examId: string) => {
    setExamToEdit(examId);
    setIsEditExamOpen(true);
  }, []);

  const handleOpenQuestionSelector = useCallback((examId: string) => {
    setExamIdForLinking(examId);
    setIsQuestionSelectorOpen(true);
  }, []);

  const handleLinkQuestionsToExam = useCallback(
    async (selectedExamNames: string[]) => {
      if (!examIdForLinking || !user?.id) return;

      // Get the exam
      const exam = (exams || []).find((e) => e.id === examIdForLinking);
      if (!exam) {
        toast.error('Prüfung nicht gefunden.');
        setIsQuestionSelectorOpen(false);
        setExamIdForLinking(null);
        return;
      }

      try {
        // Store selected exam_names in the exam's exam_name field (comma-separated if multiple)
        const examNameValue = selectedExamNames.length > 0 ? selectedExamNames.join(', ') : null;

        await updateUpcomingExam(examIdForLinking, { exam_name: examNameValue });

        if (selectedExamNames.length > 0) {
          toast.success(
            `${selectedExamNames.length} Prüfung(en) wurden ausgewählt: ${selectedExamNames.join(', ')}`,
          );
        } else {
          toast.success('Prüfungsauswahl wurde entfernt.');
        }

        // Invalidate queries to refresh exam data
        queryClient.invalidateQueries({ queryKey: ['upcoming-exams', user?.id] });
        queryClient.invalidateQueries({ queryKey: ['exam', examIdForLinking] });
      } catch (error) {
        console.error('Error updating exam exam_name:', error);
        toast.error('Fehler beim Speichern der Prüfungsauswahl');
      }

      setIsQuestionSelectorOpen(false);
      setExamIdForLinking(null);
    },
    [examIdForLinking, exams, user?.id, queryClient],
  );

  const handleStartTrainingFromExam = useCallback(
    async (examId: string) => {
      try {
        // Get the exam to find its exam_name(s)
        const exam = (exams || []).find((e) => e.id === examId);
        if (!exam?.exam_name) {
          toast.error('Prüfung hat keinen exam_name.');
          return;
        }

        const examNames = splitExamNames(exam.exam_name);
        if (examNames.length === 0) {
          toast.error('Prüfung hat keine gültigen exam_names.');
          return;
        }

        const sourceQuestions = await fetchQuestionsForExamNames(examNames);
        if (sourceQuestions.length === 0) {
          toast.info('Keine Fragen für diese Prüfung gefunden.');
          return;
        }

        const ids = sourceQuestions.map((q) => q.id);

        // Load user-specific difficulties for these questions
        if (user?.id) {
          const userDifficulties = await fetchUserDifficultiesForQuestions(user.id, ids);
          // Merge user difficulties into questions
          const questionsWithUserDifficulty = sourceQuestions.map((q) => ({
            ...q,
            difficulty: userDifficulties[q.id] ?? q.difficulty,
          }));
          setCreateSessionQuestions(questionsWithUserDifficulty);
        } else {
          setCreateSessionQuestions(sourceQuestions);
        }

        const today = new Date().toLocaleDateString('de-DE', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        });
        setCreateSessionDefaultTitle(
          exam?.title ? `${today} – ${exam.title}` : `${today} – Training Session`,
        );
        setCreateSessionExamId(examId);
        setIsCreateTrainingSessionOpen(true);
      } catch (e) {
        console.error('Failed to prepare training session from exam', e);
        toast.error('Fehler beim Laden der Fragen für die Prüfung');
      }
    },
    [exams, user?.id],
  );

  const handleDeleteExam = useCallback(
    async (examId: string) => {
      if (!user?.id) return;
      const exam = (exams || []).find((e) => e.id === examId);
      const confirmMsg = `Möchtest du die Prüfung "${exam?.title || 'Unbekannt'}" wirklich löschen? Dies löscht auch alle zugehörigen Trainingssessions und den dazugehörigen Lernfortschitt, aber NICHT die Fragen selbst.`;
      if (!window.confirm(confirmMsg)) return;

      try {
        // Delete associated training sessions first
        const allSessions = await TrainingSessionService.list(user.id);
        const sessionsToDelete = (allSessions || []).filter((s: any) => {
          const fs = s.filter_settings as any;
          return fs && fs.source === 'exam' && fs.examId === examId;
        });

        await Promise.all(sessionsToDelete.map((s) => TrainingSessionService.remove(s.id)));

        // Delete the exam (cascades to linked questions in DB via ON DELETE CASCADE)
        await deleteUpcomingExam(examId);

        toast.success('Prüfung und zugehörige Sessions gelöscht');
        window.location.reload(); // Refresh to update exam list
      } catch (e) {
        console.error('Failed to delete exam', e);
        toast.error('Fehler beim Löschen der Prüfung');
      }
    },
    [exams, user?.id],
  );

  const handleDateRangeChange = useCallback(
    (dateRange: StatisticsDateRange) => {
      if (preferences) {
        updatePreferences({ statisticsDateRange: dateRange });
      }
    },
    [preferences, updatePreferences],
  );

  // Memoized computed values

  if (!user) {
    return <LoadingState variant="skeleton" className="mx-auto max-w-page px-4 py-8 md:px-6" />;
  }

  // Show loading while preferences are being fetched
  if (!preferences) {
    return <LoadingState variant="skeleton" className="mx-auto max-w-page px-4 py-8 md:px-6" />;
  }

  if (isQuestionsLoading || isExamsLoading) {
    return <LoadingState variant="skeleton" className="mx-auto max-w-page px-4 py-8 md:px-6" />;
  }

  if (questionsError) {
    return (
      <Page>
        <ErrorState
          title="Fehler beim Laden der Daten"
          description="Es ist ein Fehler aufgetreten. Bitte versuche es später erneut."
          onRetry={() => window.location.reload()}
        />
      </Page>
    );
  }

  return (
    <Page className="space-y-8">
      <PageHeader title="Dashboard" className="mb-0 md:mb-0" />

      <ResumeSessionRow userId={user.id} />

      <div className="grid gap-4 md:grid-cols-2">
        <section aria-labelledby="stats-today" className="space-y-3">
          <h2 id="stats-today" className="text-base font-semibold">
            Heute
          </h2>
          <div className="grid grid-cols-3 gap-3">
            <StatTile label="Neu" value={todayNewCount ?? 0} />
            <StatTile label="Wiederholt" value={todayRepeatedCount ?? 0} />
            <StatTile label="Gesamt" value={todayPracticeCount ?? 0} />
          </div>
        </section>

        <section aria-labelledby="stats-total" className="space-y-3">
          <div className="flex min-h-6 flex-wrap items-center justify-between gap-2">
            <h2 id="stats-total" className="text-base font-semibold">
              Insgesamt
            </h2>
            {preferences && (
              <StatisticsDateRangeSelector
                value={preferences.statisticsDateRange}
                onChange={handleDateRangeChange}
              />
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <StatTile label="Fragen" value={totalAnsweredCount ?? 0} />
            <StatTile label="Versuche" value={totalAttemptsCount ?? 0} />
          </div>
        </section>
      </div>

      {/* Upcoming Exams Section */}
      <section aria-labelledby="exams-heading" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="exams-heading" className="flex items-center gap-2 text-xl font-semibold">
            <Calendar aria-hidden="true" className="h-5 w-5 text-muted-foreground" />
            Bevorstehende Prüfungen
          </h2>
          <Button onClick={handleOpenCreateExam}>Neue Prüfung</Button>
        </div>
        <UpcomingExamsList
          exams={exams}
          onAddQuestions={handleOpenQuestionSelector}
          onStartTraining={handleStartTrainingFromExam}
          onDeleteExam={handleDeleteExam}
          onEditExam={handleOpenEditExam}
          currentUserId={user.id}
          onOpenAnalytics={(examId) => navigate(`/exam/${examId}/analytics`)}
        />
      </section>

      <section aria-labelledby="upload-heading" className="space-y-4">
        <h2 id="upload-heading" className="text-xl font-semibold">
          Datensatz hochladen
        </h2>
        <FileUpload onQuestionsLoaded={handleQuestionsLoaded} />
      </section>

      {/* Private AI commentary quota / credits */}
      <section aria-labelledby="private-ai-heading" className="space-y-4">
        <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
          <h2 id="private-ai-heading" className="flex items-center gap-2 text-xl font-semibold">
            <ListPlus aria-hidden="true" className="h-5 w-5 text-muted-foreground" />
            Private KI-Kommentare
          </h2>
          {aiCredits?.isPremium && (
            <span className="text-sm text-muted-foreground">
              30-Tage-Zeitraum ab{' '}
              {new Date(aiCredits.monthStart).toLocaleDateString('de-DE', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
              })}
            </span>
          )}
        </div>

        {aiCreditsLoading && <LoadingState variant="skeleton" label="Status wird geladen …" />}

        {aiCreditsError && !aiCreditsLoading && (
          <ErrorState title="Status nicht verfügbar" description={aiCreditsError} />
        )}

        {!aiCreditsLoading && !aiCreditsError && aiCredits && !aiCredits.isPremium && (
          <Callout
            variant="premium"
            title="Private KI-Kommentare gibt es mit Premium"
            action={
              <Button asChild variant="outline" size="sm">
                <Link to="/subscription">Premium ansehen</Link>
              </Button>
            }
          >
            Mit Premium werden auch deine privaten Fragen von allen aktivierten KI-Modellen
            kommentiert.
          </Callout>
        )}

        {!aiCreditsLoading && !aiCreditsError && aiCredits?.isPremium && (
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-3">
              <StatTile
                label="Kostenlose private Fragen (letzte 30 Tage)"
                value={`${aiCredits.baseMonthlyFreeLimit - aiCredits.remainingFree}/${aiCredits.baseMonthlyFreeLimit}`}
                hint={`Verbleibend im aktuellen 30-Tage-Zeitraum: ${aiCredits.remainingFree}`}
              />
              <StatTile
                label="Gekaufte Credits"
                value={aiCredits.paidCreditsRemaining}
                hint="1 Credit = 1 zusätzlicher privater KI-Kommentar"
              />
              <StatTile
                label="Verfügbarkeit"
                value={aiCredits.processingBlocked ? 'Pausiert' : 'Aktiv'}
                tone={aiCredits.processingBlocked ? 'danger' : 'success'}
                hint={
                  aiCredits.processingBlocked
                    ? 'Du hast dein Kontingent für private Fragen ausgeschöpft.'
                    : 'Private Fragen werden bevorzugt verarbeitet, solange Kontingent verfügbar ist.'
                }
              />
            </div>

            <Collapsible className="rounded-lg border bg-card">
              <CollapsibleTrigger className="group flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold">
                So funktioniert’s
                <ChevronDown
                  aria-hidden="true"
                  className="h-4 w-4 transition-transform group-data-[state=open]:rotate-180"
                />
              </CollapsibleTrigger>
              <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
                <div className="border-t px-4 py-3 text-sm text-muted-foreground">
                  Bis zu 100 private Fragen pro gleitendem 30-Tage-Zeitraum werden mit allen
                  aktivierten KI-Modellen kommentiert. Alle weiteren privaten Fragen werden im
                  Hintergrund von Mistral bearbeitet; sobald ein neuer 30-Tage-Zeitraum beginnt,
                  werden zunächst die ältesten teilweise kommentierten Fragen mit den fehlenden
                  Modellen ergänzt, bis das neue Kontingent ausgeschöpft ist.
                </div>
              </CollapsibleContent>
            </Collapsible>

            <Collapsible className="rounded-lg border bg-card">
              <CollapsibleTrigger className="group flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold">
                Credits kaufen
                <ChevronDown
                  aria-hidden="true"
                  className="h-4 w-4 transition-transform group-data-[state=open]:rotate-180"
                />
              </CollapsibleTrigger>
              <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
                <div className="space-y-4 border-t px-4 py-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <label htmlFor="ai-credits-packs" className="text-sm text-muted-foreground">
                      Anzahl Pakete mit 100 Credits:
                    </label>
                    <Input
                      id="ai-credits-packs"
                      type="number"
                      min={1}
                      max={20}
                      value={aiCreditsPacks}
                      onChange={(e) =>
                        setAiCreditsPacks(
                          Math.max(
                            1,
                            Math.min(
                              20,
                              Number.isNaN(Number(e.target.value)) ? 1 : Number(e.target.value),
                            ),
                          ),
                        )
                      }
                      className="w-24"
                    />
                    <p className="text-sm text-muted-foreground">
                      entspricht {aiCreditsPacks * 100} zusätzlichen privaten KI-Kommentaren mit
                      voller Modellabdeckung für {aiCreditsPacks * 2} €.
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Checkbox
                      id="ai-credits-consent"
                      checked={aiCreditsConsent}
                      onCheckedChange={(checked) => setAiCreditsConsent(checked === true)}
                      className="mt-0.5"
                    />
                    <label
                      htmlFor="ai-credits-consent"
                      className="cursor-pointer text-sm leading-relaxed text-muted-foreground"
                    >
                      Ich verlange ausdrücklich, dass ihr vor Ablauf der Widerrufsfrist mit der
                      Leistung beginnt. Mir ist bekannt, dass ich bei einem{' '}
                      <Link to="/widerruf" target="_blank" className="underline underline-offset-4">
                        Widerruf
                      </Link>{' '}
                      Wertersatz für bis dahin genutzte Credits zahle. Credits sind nur mit Premium
                      nutzbar, verfallen aber nicht. Es gelten die{' '}
                      <Link to="/agb" target="_blank" className="underline underline-offset-4">
                        AGB
                      </Link>
                      .
                    </label>
                  </div>
                  <Button
                    onClick={handleBuyAiCredits}
                    disabled={isCreatingCreditsCheckout || !aiCreditsConsent}
                  >
                    {isCreatingCreditsCheckout
                      ? 'Weiterleitung zum Checkout …'
                      : `${aiCreditsPacks * 100} private KI-Kommentare für ${aiCreditsPacks * 2} € kaufen`}
                  </Button>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        )}
      </section>

      {/* Dialogs */}
      <UpcomingExamCreateDialog
        open={isCreateExamOpen}
        onOpenChange={setIsCreateExamOpen}
        userId={user.id}
        universityId={universityId}
      />
      <UpcomingExamEditDialog
        open={isEditExamOpen}
        onOpenChange={setIsEditExamOpen}
        exam={exams?.find((e) => e.id === examToEdit) || null}
        userId={user.id}
      />
      <ExamQuestionSelectorDialog
        open={isQuestionSelectorOpen}
        onOpenChange={setIsQuestionSelectorOpen}
        examId={examIdForLinking}
        onConfirm={handleLinkQuestionsToExam}
      />
      <TrainingSessionCreateDialog
        open={isCreateTrainingSessionOpen}
        onOpenChange={setIsCreateTrainingSessionOpen}
        questions={createSessionQuestions}
        defaultTitle={createSessionDefaultTitle}
        context={{ source: 'exam', examId: createSessionExamId || undefined }}
        onCreated={(sessionId) => navigate(`/training/session/${sessionId}`)}
      />
    </Page>
  );
};

export default Dashboard;
