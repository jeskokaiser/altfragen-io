
import React from 'react';
import { Question } from '@/types/models/Question';
import FilterForm from './FilterForm';
import { FormValues } from '@/types/models/FormValues';
import { showToast } from '@/utils/toast';
import { useQuestionFiltering } from '@/hooks/use-question-filtering';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import LoadingFallback from '@/components/common/LoadingFallback';

interface TrainingConfigProps {
  questions: Question[];
  onStart: (selectedQuestions: Question[]) => void;
}

const TrainingConfig: React.FC<TrainingConfigProps> = ({ questions, onStart }) => {
  const { filterAndPrioritizeQuestions, isLoading } = useQuestionFiltering();
  const [error, setError] = React.useState<string | null>(null);

  const subjects = React.useMemo(() => 
    Array.from(new Set(questions.map(q => q.subject))).sort((a, b) => 
      a.localeCompare(b, 'de')
    ),
    [questions]
  );

  const handleSubmit = async (values: FormValues) => {
    try {
      setError(null);
      console.log('Form values:', values);
      console.log('Total questions:', questions.length);
      
      const filteredQuestions = await filterAndPrioritizeQuestions(questions, values);

      if (filteredQuestions.length === 0) {
        showToast.error("Keine Fragen verfügbar", {
          description: "Mit den gewählten Filtereinstellungen sind keine Fragen verfügbar. Bitte passe deine Auswahl an."
        });
        setError("Mit den gewählten Filtereinstellungen sind keine Fragen verfügbar. Bitte passe deine Auswahl an.");
        return;
      }
      
      onStart(filteredQuestions);
    } catch (err) {
      console.error('Error filtering questions:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unbekannter Fehler beim Filtern der Fragen';
      setError(errorMessage);
      showToast.error("Fehler beim Starten des Trainings", {
        description: errorMessage
      });
    }
  };

  if (isLoading) {
    return <LoadingFallback message="Filtere Fragen..." />;
  }

  return (
    <div className="max-w-md mx-auto p-6">
      <h2 className="text-2xl font-semibold mb-4">Training konfigurieren</h2>
      
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Fehler</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <FilterForm 
        subjects={subjects}
        onSubmit={handleSubmit}
      />
      <br />
      <div className="mb-6 p-4 bg-muted/50 rounded-lg text-sm text-muted-foreground">
        <p className="mb-2">
          Standardmäßig werden Fragen in dieser Reihenfolge ausgewählt:
        </p>
        <ol className="list-decimal ml-4 mb-3 space-y-1">
          <li>Noch nie beantwortete Fragen</li>
          <li>Falsch beantwortete Fragen</li>
          <li>Richtig beantwortete Fragen</li>
        </ol>
        <p>
          Du kannst die Auswahl anpassen durch:
        </p>
        <ul className="list-disc ml-4 space-y-1">
         <li>Filtern nach Fach und Schwierigkeitsgrad</li>
          <li>Nur falsch beantwortete Fragen</li>
         <li>Nach Anzahl der Versuche sortieren
            <ul>
            <li>Jede Antwort zählt als ein Versuch (auch mehrere Versuche pro Frage)</li>
            </ul>
         </li>
          <li>Zufällige Auswahl aktivieren 
         <ul>
         <li>Ideal für Probeklausuren in Kombination mit benutzerdefinierter Anzahl</li>
          </ul>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default TrainingConfig;
