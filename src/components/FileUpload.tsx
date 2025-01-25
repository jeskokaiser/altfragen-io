import React from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Question } from '@/types/Question';
import { useAuth } from '@/contexts/AuthContext';
import { parseCSV } from '@/utils/CSVParser';
import { mapRowsToQuestions } from '@/utils/QuestionMapper';
import { saveQuestions } from '@/services/DatabaseService';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";

interface FileUploadProps {
  onQuestionsLoaded: (questions: Question[]) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onQuestionsLoaded }) => {
  const { user } = useAuth();
  const [error, setError] = React.useState<string | null>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setError(null);

    if (!file) {
      setError("Bitte wählen Sie eine Datei aus");
      toast.error("Keine Datei ausgewählt", {
        description: "Bitte wählen Sie eine CSV-Datei aus"
      });
      return;
    }

    if (!file.name.endsWith('.csv')) {
      setError("Bitte wählen Sie eine CSV-Datei aus");
      toast.error("Ungültiges Dateiformat", {
        description: "Es werden nur CSV-Dateien unterstützt"
      });
      return;
    }

    console.log('File selected:', file.name);

    try {
      const { headers, rows } = await parseCSV(file);
      const questions = mapRowsToQuestions(rows, headers, file.name);

      console.log('Total valid questions:', questions.length);

      if (questions.length === 0) {
        setError("Die CSV-Datei enthält keine gültigen Fragen");
        toast.error("Keine gültigen Fragen gefunden", {
          description: "Überprüfen Sie das Format Ihrer CSV-Datei"
        });
        return;
      }

      const savedQuestions = await saveQuestions(questions, user?.id || '');
      onQuestionsLoaded(savedQuestions);
      toast.success(`${questions.length} Fragen aus "${file.name}" geladen`, {
        description: "Die Fragen wurden erfolgreich gespeichert"
      });
    } catch (error: any) {
      console.error('Error processing file:', error);
      const errorMessage = error.message || "Ein unerwarteter Fehler ist aufgetreten";
      setError(errorMessage);
      toast.error("Fehler beim Verarbeiten der Datei", {
        description: errorMessage
      });
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <h2 className="text-2xl font-semibold text-slate-800">Laden Sie Ihre Fragen hoch</h2>
      <p className="text-slate-600 mb-4">
        Bitte laden Sie eine CSV-Datei mit den Spalten: Frage, A, B, C, D, E, Fach, Antwort, Kommentar, Schwierigkeit
      </p>
      
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <label htmlFor="csv-upload">
        <Button 
          variant="outline" 
          className="cursor-pointer hover:bg-slate-100"
          onClick={() => document.getElementById('csv-upload')?.click()}
        >
          CSV-Datei auswählen
        </Button>
      </label>
      <input
        id="csv-upload"
        type="file"
        accept=".csv"
        onChange={handleFileUpload}
        className="hidden"
      />
    </div>
  );
};

export default FileUpload;