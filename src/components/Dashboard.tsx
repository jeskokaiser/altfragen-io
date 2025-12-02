
import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Question } from '@/types/Question';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import DatasetList from './datasets/DatasetList';
import FileUpload from './FileUpload';
import DashboardHeader from './datasets/DashboardHeader';
import { useIsMobile } from '@/hooks/use-mobile';
import { useUserPreferences } from '@/contexts/UserPreferencesContext';
import SemesterYearFilter from './datasets/SemesterYearFilter';
import { Calendar, SlidersHorizontal, GraduationCap, ListPlus } from 'lucide-react';
import DatasetSelectionButton from './datasets/DatasetSelectionButton';
import UniversityDatasetSelector from './datasets/UniversityDatasetSelector';
import SelectedDatasetsDisplay from './datasets/SelectedDatasetsDisplay';
import { Button } from '@/components/ui/button';
import { useDashboardData } from '@/hooks/useDashboardData';
import { useQuestionFiltering } from '@/hooks/useQuestionFiltering';
import { useQuestionGrouping } from '@/hooks/useQuestionGrouping';
import { useUpcomingExams } from '@/hooks/useUpcomingExams';
import UpcomingExamCreateDialog from './exams/UpcomingExamCreateDialog';
import UpcomingExamEditDialog from './exams/UpcomingExamEditDialog';
import UpcomingExamsList from './exams/UpcomingExamsList';
import ExamQuestionSelectorDialog from './exams/ExamQuestionSelectorDialog';
import { getLinkedQuestionIdsForExam, deleteUpcomingExam } from '@/services/UpcomingExamService';
import { fetchQuestionDetails, fetchUserDifficultiesForQuestions } from '@/services/DatabaseService';
import { TrainingSessionService } from '@/services/TrainingSessionService';
import TrainingSessionCreateDialog from '@/components/training/TrainingSessionCreateDialog';
import { toast } from 'sonner';
import StatisticsDateRangeSelector from './datasets/StatisticsDateRangeSelector';
import { StatisticsDateRange } from '@/contexts/UserPreferencesContext';
import { supabase } from '@/integrations/supabase/client';

const Dashboard = () => {
  const { user, universityId } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { preferences, isDatasetArchived, updateSelectedUniversityDatasets, updatePreferences } = useUserPreferences();
  const { exams, isLoading: isExamsLoading, linkQuestions } = useUpcomingExams(user?.id);
  
  // State variables
  const [selectedFilename, setSelectedFilename] = useState<string | null>(null);
  const [selectedSemester, setSelectedSemester] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<string | null>(null);
  const [uniSelectedSemester, setUniSelectedSemester] = useState<string | null>(null);
  const [uniSelectedYear, setUniSelectedYear] = useState<string | null>(null);
  const [isDatasetSelectorOpen, setIsDatasetSelectorOpen] = useState(false);
  const [selectedUniversityDatasets, setSelectedUniversityDatasets] = useState<string[]>([]);
  const [isCreateExamOpen, setIsCreateExamOpen] = useState(false);
  const [isEditExamOpen, setIsEditExamOpen] = useState(false);
  const [examToEdit, setExamToEdit] = useState<string | null>(null);
  const [isQuestionSelectorOpen, setIsQuestionSelectorOpen] = useState(false);
  const [examIdForLinking, setExamIdForLinking] = useState<string | null>(null);
  const [isCreateTrainingSessionOpen, setIsCreateTrainingSessionOpen] = useState(false);
  const [createSessionQuestions, setCreateSessionQuestions] = useState<Question[]>([]);
  const [createSessionDefaultTitle, setCreateSessionDefaultTitle] = useState<string>(
    `${new Date().toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })} – Training Session`
  );
  const [createSessionExamId, setCreateSessionExamId] = useState<string | null>(null);

  // Private AI commentary quota & credits
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
    questions,
    isQuestionsLoading,
    questionsError,
    todayNewCount,
    todayPracticeCount,
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

        const { data: session } = await supabase.auth.getSession();
        const accessToken = session.session?.access_token;
        if (!accessToken) {
          throw new Error('Keine gültige Session gefunden');
        }

        const { data, error } = await supabase.functions.invoke('ai-comment-credits-status', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (error) {
          console.error('Fehler beim Laden der AI-Credit-Übersicht:', error);
          setAiCreditsError('Fehler beim Laden der AI-Credit-Übersicht');
        } else {
          setAiCredits(data);
        }
      } catch (err) {
        console.error('Unerwarteter Fehler beim Laden der AI-Credit-Übersicht:', err);
        setAiCreditsError('Unerwarteter Fehler beim Laden der AI-Credit-Übersicht');
      } finally {
        setAiCreditsLoading(false);
      }
    };

    loadCredits();
  }, [user?.id]);

  const handleBuyAiCredits = useCallback(async () => {
    if (!user || isCreatingCreditsCheckout) return;

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
  }, [user, isCreatingCreditsCheckout, aiCreditsPacks]);

  // Update selected university datasets when preferences change
  useEffect(() => {
    if (preferences?.selectedUniversityDatasets) {
      setSelectedUniversityDatasets(preferences.selectedUniversityDatasets);
    }
  }, [preferences?.selectedUniversityDatasets]);

  // Filter questions for personal datasets
  const filteredQuestions = useQuestionFiltering({
    questions,
    userId: user?.id,
    universityId,
    selectedSemester,
    selectedYear,
    isDatasetArchived,
    filterType: 'personal'
  });

  // Filter questions for university datasets
  const universityQuestions = useQuestionFiltering({
    questions,
    userId: user?.id,
    universityId,
    selectedSemester: uniSelectedSemester,
    selectedYear: uniSelectedYear,
    isDatasetArchived,
    filterType: 'university'
  });

  // Group questions
  const groupedQuestions = useQuestionGrouping(filteredQuestions);
  const groupedUniversityQuestions = useQuestionGrouping(universityQuestions);

  // Display filtered university datasets only if specific datasets are selected
  const displayedUniversityDatasets = useMemo(() => {
    if (selectedUniversityDatasets.length === 0) {
      return {};
    }
    
    return Object.entries(groupedUniversityQuestions)
      .filter(([key]) => selectedUniversityDatasets.includes(key))
      .reduce((acc, [key, questions]) => {
        acc[key] = questions;
        return acc;
      }, {} as Record<string, Question[]>);
  }, [groupedUniversityQuestions, selectedUniversityDatasets]);

  // Memoized event handlers
  const handleDatasetClick = useCallback((filename: string) => {
    setSelectedFilename(selectedFilename === filename ? null : filename);
  }, [selectedFilename]);

  const handleStartTraining = useCallback((questions: Question[], filterSettings?: any) => {
    localStorage.setItem('trainingQuestions', JSON.stringify(questions));
    if (filterSettings) {
      localStorage.setItem('trainingFilterSettings', JSON.stringify(filterSettings));
    }
    navigate('/training/sessions');
  }, [navigate]);

  const handleQuestionsLoaded = useCallback(() => {
    window.location.reload();
  }, []);

  const handleClearFilters = useCallback(() => {
    setSelectedSemester(null);
    setSelectedYear(null);
  }, []);

  const handleClearUniFilters = useCallback(() => {
    setUniSelectedSemester(null);
    setUniSelectedYear(null);
  }, []);

  const handleOpenDatasetSelector = useCallback(() => {
    setIsDatasetSelectorOpen(true);
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

  const handleLinkQuestionsToExam = useCallback(async (selectedIds: string[]) => {
    if (!examIdForLinking || !user?.id) return;
    const sourceOf = (qid: string): 'personal' | 'university' => {
      const q = (questions || []).find(q => q.id === qid);
      if (!q) return 'personal';
      const isPersonal = q.user_id === user.id || q.visibility === 'private';
      return isPersonal ? 'personal' : 'university';
    };
    await linkQuestions({ examId: examIdForLinking, questionIds: selectedIds, sourceOf });
    setIsQuestionSelectorOpen(false);
    setExamIdForLinking(null);
  }, [examIdForLinking, questions, user?.id, linkQuestions]);

  const handleStartTrainingFromExam = useCallback(async (examId: string) => {
    try {
      const links = await getLinkedQuestionIdsForExam(examId);
      const ids = links.map(l => l.question_id);
      if (!ids.length) return;
      const idSet = new Set(ids);
      // Use already loaded dashboard questions to avoid long Supabase URL
      const sourceQuestions = (questions || []).filter(q => idSet.has(q.id));
      if (sourceQuestions.length === 0) return;
      
      // Load user-specific difficulties for these questions
      if (user?.id) {
        const userDifficulties = await fetchUserDifficultiesForQuestions(user.id, ids);
        // Merge user difficulties into questions
        const questionsWithUserDifficulty = sourceQuestions.map(q => ({
          ...q,
          difficulty: userDifficulties[q.id] ?? q.difficulty
        }));
        setCreateSessionQuestions(questionsWithUserDifficulty);
      } else {
        setCreateSessionQuestions(sourceQuestions);
      }
      
      const exam = (exams || []).find(e => e.id === examId);
      const today = new Date().toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
      setCreateSessionDefaultTitle(exam?.title ? `${today} – ${exam.title}` : `${today} – Training Session`);
      setCreateSessionExamId(examId);
      setIsCreateTrainingSessionOpen(true);
    } catch (e) {
      console.error('Failed to prepare training session from exam', e);
    }
  }, [exams, questions, user?.id]);

  const handleDeleteExam = useCallback(async (examId: string) => {
    if (!user?.id) return;
    const exam = (exams || []).find(e => e.id === examId);
    const confirmMsg = `Möchtest du die Prüfung "${exam?.title || 'Unbekannt'}" wirklich löschen? Dies löscht auch alle zugehörigen Trainingssessions und den dazugehörigen Lernfortschitt, aber NICHT die Fragen selbst.`;
    if (!window.confirm(confirmMsg)) return;
    
    try {
      // Delete associated training sessions first
      const allSessions = await TrainingSessionService.list(user.id);
      const sessionsToDelete = (allSessions || []).filter((s: any) => {
        const fs = s.filter_settings as any;
        return fs && fs.source === 'exam' && fs.examId === examId;
      });
      
      await Promise.all(sessionsToDelete.map(s => TrainingSessionService.remove(s.id)));
      
      // Delete the exam (cascades to linked questions in DB via ON DELETE CASCADE)
      await deleteUpcomingExam(examId);
      
      toast.success('Prüfung und zugehörige Sessions gelöscht');
      window.location.reload(); // Refresh to update exam list
    } catch (e) {
      console.error('Failed to delete exam', e);
      toast.error('Fehler beim Löschen der Prüfung');
    }
  }, [exams, user?.id]);

  const handleSelectedDatasetsChange = useCallback((datasets: string[]) => {
    setSelectedUniversityDatasets(datasets);
    updateSelectedUniversityDatasets(datasets);
  }, [updateSelectedUniversityDatasets]);

  const handleRemoveDataset = useCallback((filename: string) => {
    const newDatasets = selectedUniversityDatasets.filter(f => f !== filename);
    setSelectedUniversityDatasets(newDatasets);
    updateSelectedUniversityDatasets(newDatasets);
  }, [selectedUniversityDatasets, updateSelectedUniversityDatasets]);

  const handleClearAllSelectedDatasets = useCallback(() => {
    setSelectedUniversityDatasets([]);
    updateSelectedUniversityDatasets([]);
  }, [updateSelectedUniversityDatasets]);

  const handleDateRangeChange = useCallback((dateRange: StatisticsDateRange) => {
    if (preferences) {
      updatePreferences({ statisticsDateRange: dateRange });
    }
  }, [preferences, updatePreferences]);

  // Memoized computed values
  const hasSemesterOrYearData = useMemo(() => 
    filteredQuestions.some(q => q.semester || q.year), 
    [filteredQuestions]
  );
  
  const hasUniSemesterOrYearData = useMemo(() => 
    universityQuestions.some(q => q.semester || q.year), 
    [universityQuestions]
  );
  
  const hasUniversityQuestions = useMemo(() => 
    Object.keys(groupedUniversityQuestions).length > 0, 
    [groupedUniversityQuestions]
  );

  if (!user) {
    return <div>Loading...</div>;
  }
  
  // Show loading while preferences are being fetched
  if (!preferences) {
    return (
      <div className="container mx-auto px-4 py-6 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
          <div className="h-60 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }
  
  if (isQuestionsLoading || isExamsLoading) {
    return (
      <div className="container mx-auto px-4 py-6 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
          <div className="h-60 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (questionsError) {
    return (
      <div className="container mx-auto px-4 py-6">
        <Card className="p-6">
          <CardTitle className="text-red-500 mb-2">Fehler beim Laden der Daten</CardTitle>
          <p>Es ist ein Fehler aufgetreten. Bitte versuche es später erneut.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className={`container mx-auto ${isMobile ? 'px-2' : 'px-4'} py-6 space-y-6 max-w-7xl`}>
      <DashboardHeader />

      {/* Statistics Section - Moved to Top */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Heute</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <span className="text-sm text-muted-foreground">Neu</span>
                <p className="text-2xl font-bold">{todayNewCount ?? 0}</p>
              </div>
              <div className="space-y-1">
                <span className="text-sm text-muted-foreground">Wiederholt</span>
                <p className="text-2xl font-bold">
                  {Math.max(0, (todayPracticeCount ?? 0) - (todayNewCount ?? 0))}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-sm text-muted-foreground">Gesamt</span>
                <p className="text-2xl font-bold">{todayPracticeCount ?? 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 space-y-2">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <CardTitle className="text-lg font-medium">Insgesamt</CardTitle>
              {preferences && (
                <StatisticsDateRangeSelector
                  value={preferences.statisticsDateRange}
                  onChange={handleDateRangeChange}
                />
              )}
            </div>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <span className="text-sm text-muted-foreground">Fragen</span>
              <p className="text-2xl font-bold">{totalAnsweredCount ?? 0}</p>
            </div>
            <div className="space-y-1">
              <span className="text-sm text-muted-foreground">Versuche</span>
              <p className="text-2xl font-bold">{totalAttemptsCount ?? 0}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Exams Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-xl md:text-2xl font-semibold text-slate-800 dark:text-zinc-50 flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Bevorstehende Prüfungen
          </h2>
          <Button onClick={handleOpenCreateExam}>
            Neue Prüfung
          </Button>
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

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl md:text-2xl font-semibold text-slate-800 dark:text-zinc-50">
            Datensatz hochladen
          </h2>
        </div>
        <FileUpload onQuestionsLoaded={handleQuestionsLoaded} />
      </section>

      {/* Private AI commentary quota / credits */}
      <section className="space-y-4">
        <Card>
          <CardHeader className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <ListPlus className="h-5 w-5" />
              Private KI-Kommentare
            </CardTitle>
            {aiCredits && (
              <span className="text-xs md:text-sm text-muted-foreground">
                Abrechnungsmonat {new Date(aiCredits.monthStart).toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })}
              </span>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {aiCreditsLoading && (
              <p className="text-sm text-muted-foreground">Lade Status der privaten KI-Kommentare …</p>
            )}

            {aiCreditsError && !aiCreditsLoading && (
              <p className="text-sm text-red-500">{aiCreditsError}</p>
            )}

            {!aiCreditsLoading && !aiCreditsError && aiCredits && (
              <>
                {/** Der Block passt Anzeige klar an: Non-Premium sieht 0/0 und eindeutig "Nur für Premium" */}
                {(() => {
                  const isPremium = aiCredits.isPremium;
                  const baseLimit = isPremium ? aiCredits.baseMonthlyFreeLimit : 0;
                  const usedFree = isPremium
                    ? aiCredits.baseMonthlyFreeLimit - aiCredits.remainingFree
                    : 0;
                  const remainingFreeDisplay = isPremium ? aiCredits.remainingFree : 0;
                  const availabilityLabel = !isPremium
                    ? 'Nur für Premium'
                    : aiCredits.processingBlocked
                      ? 'Pausiert'
                      : 'Aktiv';
                  const availabilityColorClass = !isPremium
                    ? 'text-yellow-500'
                    : aiCredits.processingBlocked
                      ? 'text-red-500'
                      : 'text-emerald-500';
                  const availabilityDescription = !isPremium
                    ? 'Private KI-Kommentare stehen nur Premium-Nutzern zur Verfügung.'
                    : aiCredits.processingBlocked
                      ? 'Du hast dein Kontingent für private Fragen ausgeschöpft.'
                      : 'Private Fragen werden bevorzugt verarbeitet, solange Kontingent verfügbar ist.';

                  return (
                    <>
                      <div className="grid gap-4 md:grid-cols-3">
                        <div className="space-y-1">
                          <span className="text-sm text-muted-foreground">Kostenlose private Fragen (Monat)</span>
                          <p className="text-2xl font-bold">
                            {usedFree}/{baseLimit}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Verbleibend in diesem Monat: {remainingFreeDisplay}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <span className="text-sm text-muted-foreground">Gekaufte Credits</span>
                          <p className="text-2xl font-bold">
                            {isPremium ? aiCredits.paidCreditsRemaining : 0}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            1 Credit = 1 zusätzliche privater KI-Kommentar
                          </p>
                        </div>
                        <div className="space-y-1">
                          <span className="text-sm text-muted-foreground">Verfügbarkeit</span>
                          <p className={`text-2xl font-bold ${availabilityColorClass}`}>
                            {availabilityLabel}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {availabilityDescription}
                          </p>
                        </div>
                      </div>

                      {!isPremium && (
                        <p className="text-sm text-muted-foreground">
                          Upgrade auf eine Premium-Mitgliedschaft, um private Fragen mit KI-Kommentaren verarbeiten zu lassen.
                        </p>
                      )}

                      {isPremium && (
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-2">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground">
                                Anzahl Pakete mit 100 Credits:
                              </span>
                              <input
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
                                        Number.isNaN(Number(e.target.value))
                                          ? 1
                                          : Number(e.target.value)
                                      )
                                    )
                                  )
                                }
                                className="w-20 rounded-md border border-input bg-background px-2 py-1 text-sm"
                              />
                            </div>
                            <div className="flex items-center gap-3">
                              <p className="text-sm text-muted-foreground">
                                entspricht {aiCreditsPacks * 100} zusätzlichen privaten KI-Kommentaren für{' '}
                                {aiCreditsPacks * 2}€.
                              </p>
                              <Button
                                onClick={handleBuyAiCredits}
                                disabled={isCreatingCreditsCheckout}
                              >
                                {isCreatingCreditsCheckout
                                  ? 'Weiterleitung zum Checkout …'
                                  : `${aiCreditsPacks * 100} private KI-Kommentare für ${
                                      aiCreditsPacks * 2
                                    }€ kaufen`}
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}
              </>
            )}
          </CardContent>
        </Card>
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
        exam={exams?.find(e => e.id === examToEdit) || null}
        userId={user.id}
      />
      <ExamQuestionSelectorDialog 
        open={isQuestionSelectorOpen}
        onOpenChange={setIsQuestionSelectorOpen}
        personalDatasets={groupedQuestions}
        universityDatasets={groupedUniversityQuestions}
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
    </div>
  );
};

export default Dashboard;
