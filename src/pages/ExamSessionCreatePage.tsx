
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import CreateSessionForm from '@/components/collab/CreateSessionForm';

const ExamSessionCreatePage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Create Exam Session</h1>
        <p className="text-muted-foreground">
          Set up a new collaborative exam session for you and your peers
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Session Details</CardTitle>
        </CardHeader>
        <CardContent>
          <CreateSessionForm />
        </CardContent>
      </Card>
    </div>
  );
};

export default ExamSessionCreatePage;
