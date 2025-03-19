
import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Question } from '@/types/Question';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import DatasetList from '@/components/datasets/DatasetList';
import { fetchAllQuestions } from '@/services/DatabaseService';
import SemesterYearFilter from '@/components/datasets/SemesterYearFilter';
import { GraduationCap, Folders } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const UniversityDatasets = () => {
  const { user, universityId } = useAuth();
  const navigate = useNavigate();
  const [selectedFilename, setSelectedFilename] = useState<string | null>(null);
  const [selectedSemester, setSelectedSemester] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<string | null>(null);
  const [selectedDataset, setSelectedDataset] = useState<string | null>(null);

  const { data: questions, isLoading: isQuestionsLoading, error: questionsError } = useQuery({
    queryKey: ['all-questions', user?.id, universityId],
    queryFn: async () => {
      if (!user) return [];
      return fetchAllQuestions(user.id, universityId);
    },
    enabled: !!user
  });

  const universityQuestions = useMemo(() => {
    if (!questions || !universityId) return [];
    
    let filtered = questions.filter(q => 
      q.visibility === 'university' && 
      q.university_id === universityId &&
      q.user_id !== user?.id
    );
    
    if (selectedSemester) {
      filtered = filtered.filter(q => q.semester === selectedSemester);
    }
    
    if (selectedYear) {
      filtered = filtered.filter(q => q.year === selectedYear);
    }
    
    if (selectedDataset) {
      filtered = filtered.filter(q => q.filename === selectedDataset);
    }
    
    return filtered;
  }, [questions, universityId, selectedSemester, selectedYear, selectedDataset, user?.id]);

  const groupedUniversityQuestions = useMemo(() => {
    const grouped = universityQuestions.reduce((acc, question) => {
      if (!acc[question.filename]) {
        acc[question.filename] = [];
      }
      acc[question.filename].push(question);
      return acc;
    }, {} as Record<string, Question[]>);
    
    Object.keys(grouped).forEach(filename => {
      grouped[filename].sort((a, b) => {
        if (a.year && b.year && a.year !== b.year) {
          // Compare as strings for consistent sorting
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

  // Define selectedDatasetForDisplay after groupedUniversityQuestions is defined
  const selectedDatasetForDisplay = useMemo(() => {
    if (!selectedFilename || !groupedUniversityQuestions[selectedFilename]) {
      return {};
    }
    return {
      [selectedFilename]: groupedUniversityQuestions[selectedFilename]
    };
  }, [selectedFilename, groupedUniversityQuestions]);

  const handleDatasetClick = (filename: string) => {
    if (selectedFilename === filename) {
      setSelectedFilename(null);
    } else {
      setSelectedFilename(filename);
    }
  };

  const handleStartTraining = (questions: Question[]) => {
    localStorage.setItem('trainingQuestions', JSON.stringify(questions));
    navigate('/training');
  };

  const handleClearFilters = () => {
    setSelectedSemester(null);
    setSelectedYear(null);
    setSelectedDataset(null);
  };

  if (!user) {
    return <div>Loading...</div>;
  }
  
  if (isQuestionsLoading) {
    return (
      <div className="container mx-auto px-4 py-6 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-60 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (questionsError) {
    return (
      <div className="container mx-auto px-4 py-6">
        <Card className="p-6">
          <p className="text-red-500 mb-2">Fehler beim Laden der Daten</p>
          <p>Es ist ein Fehler aufgetreten. Bitte versuche es später erneut.</p>
        </Card>
      </div>
    );
  }

  const hasUniversityQuestions = Object.keys(groupedUniversityQuestions).length > 0;
  const hasSemesterOrYearData = universityQuestions.some(q => q.semester || q.year);

  return (
    <div className="container mx-auto px-4 py-6 space-y-6 max-w-7xl">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-zinc-50 flex items-center gap-2">
          <GraduationCap className="h-7 w-7" />
          Universitäts-Fragendatenbanken
        </h1>
        <span className="text-sm text-muted-foreground">
          {universityQuestions?.length || 0} Fragen von anderen Nutzern
        </span>
      </div>

      {hasSemesterOrYearData && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-800 dark:text-zinc-50">Filter</h2>
          </div>
          <SemesterYearFilter
            questions={universityQuestions}
            selectedSemester={selectedSemester}
            selectedYear={selectedYear}
            selectedDataset={selectedDataset}
            onSemesterChange={setSelectedSemester}
            onYearChange={setSelectedYear}
            onDatasetChange={setSelectedDataset}
            onClearFilters={handleClearFilters}
            showDatasetFilter={true}
            title="Universitäts-Filter"
          />
        </section>
      )}
      
      {hasUniversityQuestions ? (
        <section className="space-y-4">
          {!selectedFilename ? (
            <div className="space-y-4">
              <h2 className="text-lg font-medium text-slate-700 dark:text-zinc-300 flex items-center gap-2">
                <Folders className="h-4 w-4" />
                Verfügbare Datensätze
              </h2>
              <DatasetList
                groupedQuestions={groupedUniversityQuestions}
                selectedFilename={selectedFilename}
                onDatasetClick={handleDatasetClick}
                onStartTraining={handleStartTraining}
                isCompactView={true}
              />
            </div>
          ) : (
            <>
              <div className="mb-4">
                <h3 className="text-lg font-medium text-slate-700 dark:text-zinc-300 flex items-center gap-2">
                  <Folders className="h-4 w-4" />
                  Ausgewählter Datensatz: {selectedFilename}
                </h3>
              </div>
              <DatasetList
                groupedQuestions={selectedDatasetForDisplay}
                selectedFilename={selectedFilename}
                onDatasetClick={handleDatasetClick}
                onStartTraining={handleStartTraining}
              />
            </>
          )}
        </section>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8 text-center">
            <p className="text-lg text-slate-600 dark:text-zinc-300 mb-2">
              Keine Universitäts-Datensätze vorhanden
            </p>
            <p className="text-sm text-muted-foreground">
              {selectedSemester || selectedYear || selectedDataset
                ? 'Keine Datensätze mit den ausgewählten Filtern gefunden'
                : 'Noch keine Datensätze von anderen Nutzern deiner Universität geteilt'
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default UniversityDatasets;
