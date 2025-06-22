
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

const Dashboard = () => {
  const { user, universityId } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { preferences, isDatasetArchived, updateSelectedUniversityDatasets } = useUserPreferences();
  
  // State variables
  const [selectedFilename, setSelectedFilename] = useState<string | null>(null);
  const [selectedSemester, setSelectedSemester] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<string | null>(null);
  const [uniSelectedSemester, setUniSelectedSemester] = useState<string | null>(null);
  const [uniSelectedYear, setUniSelectedYear] = useState<string | null>(null);
  const [isDatasetSelectorOpen, setIsDatasetSelectorOpen] = useState(false);
  const [selectedUniversityDatasets, setSelectedUniversityDatasets] = useState<string[]>([]);

  // Fetch all dashboard data
  const {
    questions,
    isQuestionsLoading,
    questionsError,
    todayNewCount,
    todayPracticeCount,
    totalAnsweredCount,
    totalAttemptsCount,
  } = useDashboardData(user?.id, universityId);

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

  const handleStartTraining = useCallback((questions: Question[]) => {
    localStorage.setItem('trainingQuestions', JSON.stringify(questions));
    navigate('/training');
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
  
  if (isQuestionsLoading) {
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

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="mb-6">
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

        <Card className="mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Insgesamt</CardTitle>
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

      {hasSemesterOrYearData && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl md:text-2xl font-semibold text-slate-800 dark:text-zinc-50 flex items-center gap-2">
              <SlidersHorizontal className="h-5 w-5" />
              Filter
            </h2>
          </div>
          <SemesterYearFilter
            questions={filteredQuestions}
            selectedSemester={selectedSemester}
            selectedYear={selectedYear}
            onSemesterChange={setSelectedSemester}
            onYearChange={setSelectedYear}
            onClearFilters={handleClearFilters}
          />
        </section>
      )}

      <section className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-xl md:text-2xl font-semibold text-slate-800 dark:text-zinc-50">
            Meine Fragendatenbanken
          </h2>
          <span className="text-sm text-muted-foreground">
            {filteredQuestions?.length || 0} Fragen insgesamt
          </span>
        </div>
        
        {filteredQuestions && filteredQuestions.length > 0 ? (
          <DatasetList
            groupedQuestions={groupedQuestions}
            selectedFilename={selectedFilename}
            onDatasetClick={handleDatasetClick}
            onStartTraining={handleStartTraining}
          />
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-lg text-slate-600 dark:text-zinc-300 mb-2">
                Keine eigenen Datensätze vorhanden
              </p>
              <p className="text-sm text-muted-foreground">
                {selectedSemester || selectedYear 
                  ? 'Keine Datensätze mit den ausgewählten Filtern gefunden'
                  : 'Lade neue Datensätze hoch, um loszulegen'
                }
              </p>
            </CardContent>
          </Card>
        )}
      </section>

      {universityId && (
        <section className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className="text-xl md:text-2xl font-semibold text-slate-800 dark:text-zinc-50 flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Universitäts-Fragendatenbanken
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {universityQuestions?.length || 0} Fragen verfügbar
              </span>
              {hasUniversityQuestions && (
                <DatasetSelectionButton 
                  onClick={handleOpenDatasetSelector}
                  totalCount={Object.keys(groupedUniversityQuestions).length}
                  selectedCount={selectedUniversityDatasets.length}
                />
              )}
            </div>
          </div>
          
          {hasUniSemesterOrYearData && (
            <SemesterYearFilter
              questions={universityQuestions}
              selectedSemester={uniSelectedSemester}
              selectedYear={uniSelectedYear}
              onSemesterChange={setUniSelectedSemester}
              onYearChange={setUniSelectedYear}
              onClearFilters={handleClearUniFilters}
              title="Universitäts-Filter"
            />
          )}
          
          {hasUniversityQuestions ? (
            selectedUniversityDatasets.length > 0 ? (
              <>
                <SelectedDatasetsDisplay 
                  groupedQuestions={groupedUniversityQuestions}
                  selectedDatasets={selectedUniversityDatasets}
                  onRemoveDataset={handleRemoveDataset}
                  onClearAll={handleClearAllSelectedDatasets}
                />
                <DatasetList
                  groupedQuestions={displayedUniversityDatasets}
                  selectedFilename={selectedFilename}
                  onDatasetClick={handleDatasetClick}
                  onStartTraining={handleStartTraining}
                />
              </>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                  <p className="text-lg text-slate-600 dark:text-zinc-300 mb-2">
                    Keine Datensätze ausgewählt
                  </p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Wähle Datensätze aus, um sie dauerhaft im Dashboard anzuzeigen.
                  </p>
                  <Button onClick={handleOpenDatasetSelector}>
                    <ListPlus className="mr-2 h-4 w-4" />
                    Datensätze wählen
                  </Button>
                </CardContent>
              </Card>
            )
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                <p className="text-lg text-slate-600 dark:text-zinc-300 mb-2">
                  Keine Universitäts-Datensätze vorhanden
                </p>
                <p className="text-sm text-muted-foreground">
                  {uniSelectedSemester || uniSelectedYear 
                    ? 'Keine Datensätze mit den ausgewählten Filtern gefunden'
                    : 'Noch keine Datensätze von anderen Nutzern deiner Universität geteilt'
                  }
                </p>
              </CardContent>
            </Card>
          )}
          
          <UniversityDatasetSelector 
            open={isDatasetSelectorOpen}
            onOpenChange={setIsDatasetSelectorOpen}
            groupedQuestions={groupedUniversityQuestions}
            selectedDatasets={selectedUniversityDatasets}
            onSelectedDatasetsChange={handleSelectedDatasetsChange}
          />
        </section>
      )}

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl md:text-2xl font-semibold text-slate-800 dark:text-zinc-50">
            Datensatz hochladen
          </h2>
        </div>
        <FileUpload onQuestionsLoaded={handleQuestionsLoaded} />
      </section>
    </div>
  );
};

export default Dashboard;
