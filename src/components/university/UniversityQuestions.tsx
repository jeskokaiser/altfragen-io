
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getUniversityQuestions } from '@/services/DatabaseService';
import { Question } from '@/types/Question';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';
import { toast } from 'sonner';
import QuestionList from '@/components/datasets/QuestionList';

const UniversityQuestions = () => {
  const { universityId, isEmailVerified } = useAuth();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFilename, setSelectedFilename] = useState<string | null>(null);

  useEffect(() => {
    const fetchQuestions = async () => {
      if (!universityId || !isEmailVerified) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await getUniversityQuestions(universityId);
        setQuestions(data);
        setError(null);
      } catch (err: any) {
        console.error('Error fetching university questions:', err);
        setError(err.message || 'Fehler beim Laden der Universitätsfragen');
        toast.error('Fehler beim Laden der Universitätsfragen');
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [universityId, isEmailVerified]);

  if (!isEmailVerified) {
    return (
      <Alert className="mb-4">
        <Info className="h-4 w-4" />
        <AlertDescription>
          Bitte verifizieren Sie Ihre E-Mail-Adresse, um auf Universitätsfragen zugreifen zu können.
        </AlertDescription>
      </Alert>
    );
  }

  if (!universityId) {
    return (
      <Alert className="mb-4">
        <Info className="h-4 w-4" />
        <AlertDescription>
          Ihr Konto ist keiner Universität zugeordnet. Bitte verwenden Sie eine Universitäts-E-Mail-Adresse.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Universitätsfragen</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center p-4">Laden...</div>
        ) : error ? (
          <Alert className="mb-4" variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : questions.length === 0 ? (
          <div className="text-center p-4">
            <p className="text-lg text-slate-600 dark:text-zinc-300 mb-2">
              Keine Universitätsfragen gefunden.
            </p>
            <p className="text-sm mt-2">
              Teilen Sie Ihre Fragen mit Ihrer Universität, damit sie hier erscheinen.
            </p>
          </div>
        ) : (
          <div>
            <QuestionList 
              questions={questions} 
              isSelected={true}
              isLoading={loading}
              showFilters={true}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UniversityQuestions;
