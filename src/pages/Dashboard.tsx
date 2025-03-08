
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Question } from '@/types/models/Question';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { DatasetList } from '@/components/features';
import FileUpload from '@/components/FileUpload';
import DashboardHeader from '@/components/layout/DashboardHeader';
import { useIsMobile } from '@/hooks/use-mobile';
import { useQuery } from '@tanstack/react-query';
import { 
  fetchTodayNewCount, 
  fetchTodayPracticeCount, 
  fetchTotalAnsweredCount, 
  fetchTotalAttemptsCount 
} from '@/services/QuestionService';
import { useDatasetManagement } from '@/hooks/use-dataset-management';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, User, Database } from 'lucide-react';
import { DatasetView } from '@/types/models/DatasetView';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [selectedFilename, setSelectedFilename] = useState<string | null>(null);

  const { 
    datasetView,
    setDatasetView,
    unarchivedQuestions, 
    groupedQuestions, 
    isLoading: isQuestionsLoading,
    toggleDatasetVisibility,
    isDatasetShared,
    userOrganization
  } = useDatasetManagement();

  const { data: todayNewCount, isLoading: isNewCountLoading } = useQuery({
    queryKey: ['today-new', user?.id],
    queryFn: () => fetchTodayNewCount(user?.id || ''),
    enabled: !!user
  });

  const { data: todayPracticeCount, isLoading: isPracticeCountLoading } = useQuery({
    queryKey: ['today-practice', user?.id],
    queryFn: () => fetchTodayPracticeCount(user?.id || ''),
    enabled: !!user
  });

  const { data: totalAnsweredCount, isLoading: isTotalAnswersLoading } = useQuery({
    queryKey: ['total-answers', user?.id],
    queryFn: () => fetchTotalAnsweredCount(user?.id || ''),
    enabled: !!user
  });

  const { data: totalAttemptsCount, isLoading: isTotalAttemptsLoading } = useQuery({
    queryKey: ['total-attempts', user?.id],
    queryFn: () => fetchTotalAttemptsCount(user?.id || ''),
    enabled: !!user
  });

  const isLoading = 
    isQuestionsLoading || 
    isNewCountLoading || 
    isPracticeCountLoading || 
    isTotalAnswersLoading || 
    isTotalAttemptsLoading;

  const handleDatasetClick = (filename: string) => {
    setSelectedFilename(selectedFilename === filename ? null : filename);
  };

  const handleStartTraining = (questions: Question[]) => {
    localStorage.setItem('trainingQuestions', JSON.stringify(questions));
    navigate('/training');
  };

  const handleQuestionsLoaded = () => {
    // Refresh the questions list
    window.location.reload();
  };

  if (!user) {
    return <div>Loading...</div>;
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
            {isLoading ? (
              <div className="h-16 flex items-center justify-center">
                <p className="text-muted-foreground">Loading...</p>
              </div>
            ) : (
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
            )}
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Insgesamt</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-16 flex items-center justify-center">
                <p className="text-muted-foreground">Loading...</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-sm text-muted-foreground">Fragen</span>
                  <p className="text-2xl font-bold">{totalAnsweredCount ?? 0}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-sm text-muted-foreground">Versuche</span>
                  <p className="text-2xl font-bold">{totalAttemptsCount ?? 0}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium">
            Organisation: {userOrganization?.domain || 'Keine Organization'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Datasets können mit allen Nutzern, die eine E-Mail-Adresse mit derselben Domain ({user.email?.split('@')[1]}) haben, geteilt werden.
          </p>
        </CardContent>
      </Card>

      <section className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-xl md:text-2xl font-semibold text-slate-800 dark:text-zinc-50">
            Fragendatenbanken
          </h2>
          <span className="text-sm text-muted-foreground">
            {isQuestionsLoading ? 'Loading...' : `${unarchivedQuestions?.length || 0} Fragen insgesamt`}
          </span>
        </div>

        <Tabs defaultValue="all" className="w-full" onValueChange={(value) => setDatasetView(value as DatasetView)}>
          <TabsList className="mb-4">
            <TabsTrigger value="all" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Alle Datasets
            </TabsTrigger>
            <TabsTrigger value="personal" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Meine Datasets
            </TabsTrigger>
            <TabsTrigger value="organizational" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Geteilte Datasets
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="mt-0">
            {isQuestionsLoading ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                  <p className="text-muted-foreground">Lade Datensätze...</p>
                </CardContent>
              </Card>
            ) : unarchivedQuestions && unarchivedQuestions.length > 0 ? (
              <DatasetList
                groupedQuestions={groupedQuestions}
                selectedFilename={selectedFilename}
                onDatasetClick={handleDatasetClick}
                onStartTraining={handleStartTraining}
                onToggleVisibility={toggleDatasetVisibility}
                isDatasetShared={isDatasetShared}
              />
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                  <p className="text-lg text-slate-600 dark:text-zinc-300 mb-2">
                    Keine Datensätze vorhanden
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Lade neue Datensätze hoch, um loszulegen
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="personal" className="mt-0">
            {isQuestionsLoading ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                  <p className="text-muted-foreground">Lade Datensätze...</p>
                </CardContent>
              </Card>
            ) : Object.keys(groupedQuestions).length > 0 ? (
              <DatasetList
                groupedQuestions={groupedQuestions}
                selectedFilename={selectedFilename}
                onDatasetClick={handleDatasetClick}
                onStartTraining={handleStartTraining}
                onToggleVisibility={toggleDatasetVisibility}
                isDatasetShared={isDatasetShared}
              />
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                  <p className="text-lg text-slate-600 dark:text-zinc-300 mb-2">
                    Keine eigenen Datensätze vorhanden
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Lade neue Datensätze hoch, um loszulegen
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="organizational" className="mt-0">
            {isQuestionsLoading ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                  <p className="text-muted-foreground">Lade geteilte Datensätze...</p>
                </CardContent>
              </Card>
            ) : Object.keys(groupedQuestions).length > 0 ? (
              <DatasetList
                groupedQuestions={groupedQuestions}
                selectedFilename={selectedFilename}
                onDatasetClick={handleDatasetClick}
                onStartTraining={handleStartTraining}
                onToggleVisibility={toggleDatasetVisibility}
                isDatasetShared={isDatasetShared}
              />
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                  <p className="text-lg text-slate-600 dark:text-zinc-300 mb-2">
                    Keine geteilten Datensätze vorhanden
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Nutzer mit der gleichen Email-Domain (@{user.email?.split('@')[1]}) können Datensätze mit dir teilen
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </section>

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
