
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import DatasetList from '@/components/datasets/DatasetList';
import DashboardHeader from '@/components/datasets/DashboardHeader';

const Dashboard = () => {
  const { user } = useAuth();
  
  // This component is currently not used by the project
  // It's just a placeholder that can be developed further
  
  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <DashboardHeader />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-8">
        <Card>
          <CardHeader>
            <CardTitle>Questions Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Questions summary content will go here</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Training Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Training summary content will go here</p>
          </CardContent>
        </Card>
      </div>
      
      <h2 className="text-2xl font-bold mb-4">Meine Datensätze</h2>
      <p>Dataset list will be implemented here</p>
    </div>
  );
};

export default Dashboard;
