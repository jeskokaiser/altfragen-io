
import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { fetchUniversityQuestions } from '@/services/QuestionService';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { School, ArrowRight } from 'lucide-react';
import { Question } from '@/types/models/Question';

const UniversityQuestions: React.FC = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  
  const isUniversityVerified = profile?.is_email_verified && profile?.university_id;
  
  const { data: universityQuestions, isLoading } = useQuery({
    queryKey: ['universityQuestions', profile?.university_id],
    queryFn: () => fetchUniversityQuestions(profile?.university_id || ''),
    enabled: !!isUniversityVerified,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  const startTraining = (questions: Question[]) => {
    // Store questions in sessionStorage for training page
    sessionStorage.setItem('trainingQuestions', JSON.stringify(questions));
    navigate('/training');
  };
  
  if (!isUniversityVerified) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <School className="h-5 w-5" />
            University Questions
          </CardTitle>
          <CardDescription>
            Verify your university email to access questions shared by your university peers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={() => navigate('/settings')}>
            Verify University Email
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <School className="h-5 w-5" />
          {profile?.university?.name || 'University'} Questions
        </CardTitle>
        <CardDescription>
          Questions shared by other students from your university
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-slate-500">Loading university questions...</p>
        ) : !universityQuestions || universityQuestions.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-sm text-slate-500 mb-4">
              No questions shared by your university peers yet
            </p>
            <Button variant="outline" onClick={() => navigate('/settings')}>
              Share Your Own Questions
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              {universityQuestions.length} questions available from your university peers
            </p>
            <div className="flex justify-between items-center">
              <Button 
                variant="default" 
                onClick={() => startTraining(universityQuestions)}
                className="gap-1"
              >
                Start Training <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UniversityQuestions;
