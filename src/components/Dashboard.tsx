import React, { useMemo, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Question } from '@/types/Question';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import DatasetList from './datasets/DatasetList';
import FileUpload from './FileUpload';
import DashboardHeader from './datasets/DashboardHeader';
import { useIsMobile } from '@/hooks/use-mobile';
import { useUserPreferences } from '@/contexts/UserPreferencesContext';
import { fetchAllQuestions } from '@/services/DatabaseService';
import SemesterYearFilter from './datasets/SemesterYearFilter';
import { Calendar, SlidersHorizontal, GraduationCap, ListPlus } from 'lucide-react';
import DatasetSelectionButton from './datasets/DatasetSelectionButton';
import UniversityDatasetSelector from './datasets/UniversityDatasetSelector';
import SelectedDatasetsDisplay from './datasets/SelectedDatasetsDisplay';
import { Button } from '@/components/ui/button';

const Dashboard = () => {
  const { user, universityId } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { preferences, isDatasetArchived, updateSelectedUniversityDatasets } = useUserPreferences();
  const [selectedFilename, setSelectedFilename] = useState<string | null>(null);
  const [selectedSemester, setSelectedSemester] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<string | null>(null);
  const [uniSelectedSemester, setUniSelectedSemester] = useState<string | null>(null);
  const [uniSelectedYear, setUniSelectedYear] = useState<string | null>(null);
  
  const [isDatasetSelectorOpen, setIsDatasetSelectorOpen] = useState(false);
  const [selectedUniversityDatasets, setSelectedUniversityDatasets] = useState<string[]>([]);

  useEffect(() => {
    if (preferences?.selectedUniversityDatasets) {
      setSelectedUniversityDatasets(preferences.selectedUniversityDatasets);
    }
  }, [preferences?.selectedUniversityDatasets]);

  const { data: questions, isLoading: isQuestionsLoading, error: questionsError } = useQuery({
    queryKey: ['all-questions', user?.id, universityId],
    queryFn: async () => {
      if (!user) return [];
      return fetchAllQuestions(user.id, universityId);
    },
    enabled: !!user
  });

  const { data: todayNewCount } = useQuery({
    queryKey: ['today-new', user?.id],
    queryFn: async () => {
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);
      const { data, error } = await supabase
        .from('user_progress')
        .select('id')
        .eq('user_id', user?.id)
        .gte('created_at', today.toISOString());
      if (error) throw error;
      return data?.length ?? 0;
    },
    enabled: !!user
  });

  const { data: todayPracticeCount } = useQuery({
    queryKey: ['today-practice', user?.id],
    queryFn: async () => {
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);
      const { data, error } = await supabase
        .from('user_progress')
        .select('id')
        .eq('user_id', user?.id)
        .gte('updated_at', today.toISOString());
      if (error) throw error;
      return data?.length ?? 0;
    },
    enabled: !!user
  });

  const { data: totalAnsweredCount } = useQuery({
    queryKey: ['total-answers', user?.id],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('user_progress')
        .select('*', { count: 'exact' })
        .eq('user_id', user?.id);
      if (error) throw error;
      return count || 0;
    },
    enabled: !!user
  });

  const { data: totalAttemptsCount } = useQuery({
    queryKey: ['total-attempts', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_progress')
        .select('attempts_count')
        .eq('user_id', user?.id);
      if (error) throw error;
      const totalAttempts = data.reduce((sum, record) => sum + (record.attempts_count || 1), 0);
      return totalAttempts;
    },
    enabled: !!user
  });

  const filteredQuestions = useMemo(() => {
    if (!questions || !preferences) return [];
    
    let filtered = questions.filter(q => 
      !isDatasetArchived(q.filename) && 
      q.user_id === user?.id &&
      q.visibility === 'private'
    );
    
    if (selectedSemester) {
      filtered = filtered.filter(q => q.semester === selectedSemester);
    }
    
    if (selectedYear) {
      filtered = filtered.filter(q => q.year === selectedYear);
    }
    
    return filtered;
  }, [questions, preferences, isDatasetArchived, selectedSemester, selectedYear, user?.id]);

  const universityQuestions = useMemo(() => {
    if (!questions || !universityId) {
      return [];
    }
    
    let filtered = questions.filter(q => {
      return q.visibility === 'university' && q.university_id === universityId;
    });
    
    if (uniSelectedSemester) {
      filtered = filtered.filter(q => q.semester === uniSelectedSemester);
    }
    
    if (uniSelectedYear) {
      filtered = filtered.filter(q => q.year === uniSelectedYear);
    }
    
    return filtered;
  }, [questions, universityId, uniSelectedSemester, uniSelectedYear]);

  const groupedQuestions = useMemo(() => {
    const grouped = filteredQuestions.reduce((acc, question) => {
      const key = question.exam_name || question.filename;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(question);
      return acc;
    }, {} as Record<string, Question[]>);
    
    Object.keys(grouped).forEach(key => {
      grouped[key].sort((a, b) => {
        if (a.year && b.year && a.year !== b.year) {
          return b.year.localeCompare(a.year);
        }
        
        if (a.semester && b.semester && a.semester !== b.semester) {
          const semA = a.semester.startsWith('WS') ? 1 : 2;
          const semB = b.semester.startsWith('WS') ? 1 : 2;
          return semA - semB;
        }
        
        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
      });
    });
    
    return grouped;
  }, [filteredQuestions]);

  // Group university questions by exam_name instead of filename
  const groupedUniversityQuestions = useMemo(() => {
    const grouped = universityQuestions.reduce((acc, question) => {
      // Use exam_name as the primary key for grouping university questions
      const key = question.exam_name || question.filename;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(question);
      return acc;
    }, {} as Record<string, Question[]>);
    
    Object.keys(grouped).forEach(key => {
      grouped[key].sort((a, b) => {
        if (a.year && b.year && a.year !== b.year) {
          return b.year.localeCompare(a.year);
        }
        
        if (a.semester && b.semester && a.semester !== b.semester) {
          const semA = a.semester.startsWith('WS') ? 1 : 2;
          const semB = b.semester.startsWith('WS') ? 1 : 2;
          return semA - semB;
        }
        
        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
      });
    });
    
    return grouped;
  }, [universityQuestions]);

  // Show filtered university datasets only if specific datasets are selected
  const displayedUniversityDatasets = useMemo(() => {
    if (selectedUniversityDatasets.length === 0) {
      // Show no university datasets when none are specifically selected
      return {};
    }
    
    // Show only selected datasets (now based on exam_name)
    return Object.entries(groupedUniversityQuestions)
      .filter(([key]) => selectedUniversityDatasets.includes(key))
      .reduce((acc, [key, questions]) => {
        acc[key] = questions;
        return acc;
      }, {} as Record<string, Question[]>);
  }, [groupedUniversityQuestions, selectedUniversityDatasets]);

  const handleDatasetClick = (filename: string) => {
    setSelectedFilename(selectedFilename === filename ? null : filename);
  };

  const handleStartTraining = (questions: Question[]) => {
    localStorage.setItem('trainingQuestions', JSON.stringify(questions));
    navigate('/training');
  };

  const handleQuestionsLoaded = () => {
    window.location.reload();
  };

  const handleClearFilters = () => {
    setSelectedSemester(null);
    setSelectedYear(null);
  };

  const handleClearUniFilters = () => {
    setUniSelectedSemester(null);
    setUniSelectedYear(null);
  };

  const handleOpenDatasetSelector = () => {
    setIsDatasetSelectorOpen(true);
  };

  const handleSelectedDatasetsChange = (datasets: string[]) => {
    setSelectedUniversityDatasets(datasets);
    updateSelectedUniversityDatasets(datasets);
  };

  const handleRemoveDataset = (filename: string) => {
    const newDatasets = selectedUniversityDatasets.filter(f => f !== filename);
    setSelectedUniversityDatasets(newDatasets);
    updateSelectedUniversityDatasets(newDatasets);
  };

  const handleClearAllSelectedDatasets = () => {
    setSelectedUniversityDatasets([]);
    updateSelectedUniversityDatasets([]);
  };

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

  const hasSemesterOrYearData = filteredQuestions.some(q => q.semester || q.year);
  const hasUniSemesterOrYearData = universityQuestions.some(q => q.semester || q.year);
  const hasUniversityQuestions = Object.keys(groupedUniversityQuestions).length > 0;

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
                {selectedUniversityDatasets.length > 0
                  ? `${Object.values(displayedUniversityDatasets).reduce((sum, questions) => sum + questions.length, 0)} Fragen ausgewählt`
                  : `${universityQuestions?.length || 0} Fragen verfügbar`
                }
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
