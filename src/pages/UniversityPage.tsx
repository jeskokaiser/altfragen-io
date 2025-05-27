
import React from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const UniversityPage: React.FC = () => {
  const { universityId } = useParams<{ universityId: string }>();

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">University Details</h1>
        <p className="text-muted-foreground">
          Information and resources for university {universityId}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>University Information</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            University-specific content and datasets will be displayed here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default UniversityPage;
