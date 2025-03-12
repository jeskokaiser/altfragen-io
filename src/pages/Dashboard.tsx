import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { QuestionsSummary } from '@/components/dashboard/QuestionsSummary';
import { TrainingSummary } from '@/components/dashboard/TrainingSummary';
import { DatasetList } from '@/components/datasets/DatasetList';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import UniversityQuestions from '@/components/university/UniversityQuestions';

const Dashboard = () => {
  const { user } = useAuth();
  const userId = user?.id;
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [unclearCount, setUnclearCount] = useState(0);
  const { universityId, isEmailVerified } = useAuth();

  useEffect(() => {
    if (!userId) return;

    const fetchTotalQuestions = async () => {
      // Fetch total questions logic here (example)
      setTotalQuestions(100); // Replace with actual data fetching
    };

    const fetchUnclearCount = async () => {
      // Fetch unclear questions count logic here (example)
      setUnclearCount(10); // Replace with actual data fetching
    };

    fetchTotalQuestions();
    fetchUnclearCount();
  }, [userId]);

  return (
    <div className="container mx-auto px-4 py-8">
      <DashboardHeader />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-8">
        <QuestionsSummary totalQuestions={totalQuestions} unclearCount={unclearCount} userId={userId} />
        <TrainingSummary userId={userId} />
      </div>
      
      {/* University Questions Section */}
      {universityId && isEmailVerified && (
        <div className="my-8">
          <h2 className="text-2xl font-bold mb-4">Universitätsfragen</h2>
          <UniversityQuestions />
        </div>
      )}
      
      <h2 className="text-2xl font-bold mb-4">Meine Datensätze</h2>
      <DatasetList />
    </div>
  );
};

export default Dashboard;
