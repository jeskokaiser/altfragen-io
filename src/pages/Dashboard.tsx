
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchQuestions } from '@/services/QuestionService';
import { Question } from '@/types/models/Question';
import { logError } from '@/utils/errorHandler';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Skeleton } from "@/components/ui/skeleton";
import { Pagination } from "@/components/ui/pagination"
import { ChevronLeft, ChevronRight } from "lucide-react"
import DatasetList from '@/components/features/datasets/DatasetList';
import QuestionsSummary from '@/components/features/dashboard/QuestionsSummary';
import TrainingSummary from '@/components/features/dashboard/TrainingSummary';
import UniversityQuestions from '@/components/features/dashboard/UniversityQuestions';

const DashboardHeader = () => {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-bold mb-2">Dashboard</h1>
      <p className="text-slate-600">
        Welcome to your Altfragen.io dashboard! Here you can manage your datasets, track your progress, and start new training sessions.
      </p>
    </div>
  );
};

const Dashboard = () => {
  const { user } = useAuth();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedFilename, setSelectedFilename] = useState<string | null>(null);
  const navigate = useNavigate();
  const [unclearCount, setUnclearCount] = useState(0);
  
  const pageSize = 10;
  const page = parseInt(searchParams.get('page') || '1', 10);
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  
  useEffect(() => {
    const loadQuestions = async () => {
      setLoading(true);
      try {
        const data = await fetchQuestions();
        setQuestions(data);
        
        // Calculate and set the count of unclear questions
        const unclear = data.filter(q => q.is_unclear === true).length;
        setUnclearCount(unclear);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to load questions'));
        logError(err, { component: 'Dashboard', function: 'loadQuestions' });
      } finally {
        setLoading(false);
      }
    };
    
    loadQuestions();
  }, []);
  
  const handlePageChange = (newPage: number) => {
    setSearchParams({ page: newPage.toString() });
  };
  
  const handleDatasetClick = (filename: string) => {
    setSelectedFilename(prev => prev === filename ? null : filename);
  };
  
  const startTraining = (questions: Question[]) => {
    // Store questions in sessionStorage for training page
    sessionStorage.setItem('trainingQuestions', JSON.stringify(questions));
    navigate('/training');
  };
  
  const groupedQuestions = React.useMemo(() => {
    return questions.reduce((acc: Record<string, Question[]>, question) => {
      if (!acc[question.filename]) {
        acc[question.filename] = [];
      }
      acc[question.filename].push(question);
      return acc;
    }, {});
  }, [questions]);
  
  const paginatedQuestions = React.useMemo(() => {
    const dataset = Object.entries(groupedQuestions).find(([filename]) => filename === selectedFilename);
    if (!dataset) return [];
    
    const [, questions] = dataset;
    return questions.slice(startIndex, endIndex);
  }, [groupedQuestions, selectedFilename, startIndex, endIndex]);

  // Calculate derived stats for the summary components
  const publicQuestions = questions.filter(q => q.visibility === 'public').length;
  const universityQuestions = questions.filter(q => q.visibility === 'university').length;
  
  // Training summary stats - in a real app these would come from a backend call
  // Using placeholders for now
  const todayNew = 5;
  const todayPractice = 12;
  const totalAnswered = 78;
  const totalAttempts = 95;

  return (
    <div className="container mx-auto px-4 py-8">
      <DashboardHeader />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <QuestionsSummary 
          totalQuestions={questions.length} 
          publicQuestions={publicQuestions}
          universityQuestions={universityQuestions}
          unclearCount={unclearCount}
          userId={user?.id}
        />
        <UniversityQuestions />
        <TrainingSummary 
          userId={user?.id}
          todayNew={todayNew}
          todayPractice={todayPractice}
          totalAnswered={totalAnswered}
          totalAttempts={totalAttempts}
        />
      </div>
      
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Datasets</h2>
        <p className="text-slate-600">
          Explore your datasets and start training sessions
        </p>
      </div>
      
      {loading ? (
        <div className="grid gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="w-full">
              <CardHeader>
                <CardTitle><Skeleton className="h-5 w-40" /></CardTitle>
                <CardDescription><Skeleton className="h-4 w-60" /></CardDescription>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : error ? (
        <div className="text-red-500">Error: {error.message}</div>
      ) : (
        <DatasetList
          groupedQuestions={groupedQuestions}
          selectedFilename={selectedFilename}
          onDatasetClick={handleDatasetClick}
          onStartTraining={startTraining}
        />
      )}
      
      {selectedFilename && groupedQuestions[selectedFilename] && (
        <Pagination
          page={page}
          totalCount={groupedQuestions[selectedFilename].length}
          pageSize={pageSize}
          onPageChange={handlePageChange}
          className="mt-4"
        />
      )}
    </div>
  );
};

export default Dashboard;
