import React from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Question } from '@/types/Question';
import { useAuth } from '@/contexts/AuthContext';
import { parseCSV } from '@/utils/CSVParser';
import { mapRowsToQuestions } from '@/utils/QuestionMapper';
import { saveQuestions } from '@/services/DatabaseService';

interface FileUploadProps {
  onQuestionsLoaded: (questions: Question[]) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onQuestionsLoaded }) => {
  const { user } = useAuth();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      toast.error("Keine Datei ausgewählt");
      return;
    }

    console.log('File selected:', file.name);

    try {
      const { headers, rows } = await parseCSV(file);
      const questions = mapRowsToQuestions(rows, headers, file.name);

      console.log('Total valid questions:', questions.length);

      if (questions.length === 0) {
        toast.error("Keine gültigen Fragen in der CSV-Datei gefunden");
        return;
      }

      const savedQuestions = await saveQuestions(questions, user?.id || '');
      onQuestionsLoaded(savedQuestions);
      toast.success(`${questions.length} Fragen aus "${file.name}" geladen und gespeichert`);
    } catch (error: any) {
      console.error('Error processing file:', error);
      toast.error(error.message || "Ein Fehler ist aufgetreten");
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <h2 className="text-2xl font-semibold text-slate-800">Laden Sie Ihre Fragen hoch</h2>
      <p className="text-slate-600 mb-4">
        Bitte laden Sie eine CSV-Datei mit den Spalten: Frage, A, B, C, D, E, Fach, Antwort, Kommentar, Schwierigkeit
      </p>
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