import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { fetchUniversityQuestions } from '@/services/QuestionService';
import { Question } from '@/types/models/Question';
import { School, AlertCircle, ArrowLeft } from 'lucide-react';
import DatasetCard from '@/components/features/datasets/DatasetCard';

const University: React.FC = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilename, setSelectedFilename] = useState<string | null>(null);

  const isUniversityVerified = profile?.is_email_verified && profile?.university_id;

  useEffect(() => {
    const loadUniversityQuestions = async () => {
      if (!isUniversityVerified || !profile?.university_id) {
        setLoading(false);
        return;
      }

      try {
        const data = await fetchUniversityQuestions(profile.university_id);
        setQuestions(data);
      } catch (error) {
        console.error('Error loading university questions:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUniversityQuestions();
  }, [isUniversityVerified, profile?.university_id]);

  const groupQuestionsByFilename = (questions: Question[]): Record<string, Question[]> => {
    return questions.reduce((acc, question) => {
      if (!acc[question.filename]) {
        acc[question.filename] = [];
      }
      acc[question.filename].push(question);
      return acc;
    }, {} as Record<string, Question[]>);
  };

  const handleDatasetClick = (filename: string) => {
    setSelectedFilename(prev => prev === filename ? null : filename);
  };

  const startTraining = (questions: Question[]) => {
    sessionStorage.setItem('trainingQuestions', JSON.stringify(questions));
    navigate('/training');
  };

  if (!isUniversityVerified) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/dashboard')} 
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
        </Button>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <School className="h-5 w-5" />
              University Questions
            </CardTitle>
            <CardDescription>
              Access questions shared by your university peers
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You need to verify your university email to access university-shared questions.
              </AlertDescription>
            </Alert>
            <Button onClick={() => navigate('/settings')}>
              Verify University Email
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const groupedQuestions = groupQuestionsByFilename(questions);

  return (
    <div className="container mx-auto px-4 py-8">
      <Button 
        variant="ghost" 
        onClick={() => navigate('/dashboard')} 
        className="mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
      </Button>

      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2 flex items-center gap-2">
          <School className="h-6 w-6" />
          {profile?.university?.name || 'University'} Questions
        </h1>
        <p className="text-slate-600">
          Access and practice questions shared by your university peers
        </p>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <p>Loading university questions...</p>
        </div>
      ) : Object.keys(groupedQuestions).length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <School className="h-12 w-12 mx-auto mb-4 text-slate-400" />
            <h3 className="text-xl font-semibold mb-2">No University Questions Yet</h3>
            <p className="text-slate-600 mb-4">
              There are no questions shared by your university peers yet.
            </p>
            <Button onClick={() => navigate('/settings')}>
              Share Your Questions
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.keys(groupedQuestions).map(filename => (
            <DatasetCard
              key={filename}
              filename={filename}
              questions={groupedQuestions[filename]}
              isSelected={selectedFilename === filename}
              onDatasetClick={handleDatasetClick}
              onStartTraining={startTraining}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default University;
