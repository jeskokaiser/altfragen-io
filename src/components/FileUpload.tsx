import React from 'react';
import Papa from 'papaparse';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Question } from '@/types/Question';

interface FileUploadProps {
  onQuestionsLoaded: (questions: Question[]) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onQuestionsLoaded }) => {
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      complete: (results) => {
        const headers = results.data[0] as string[];
        const requiredColumns = ['Frage', 'A', 'B', 'C', 'D', 'E', 'Fach', 'Antwort', 'Kommentar'];
        
        const columnExists = requiredColumns.every(col => 
          headers.some(header => header === col)
        );

        if (!columnExists) {
          toast.error("CSV muss die Spalten enthalten: Frage, A, B, C, D, E, Fach, Antwort, Kommentar");
          return;
        }

        const questions = (results.data as string[][])
          .slice(1) // Skip header row
          .filter(row => row.length >= 9) // Ensure all columns are present
          .map(row => {
            const headerMap = headers.reduce((acc, header, index) => {
              acc[header] = row[index];
              return acc;
            }, {} as Record<string, string>);

            return {
              question: headerMap['Frage'],
              optionA: headerMap['A'],
              optionB: headerMap['B'],
              optionC: headerMap['C'],
              optionD: headerMap['D'],
              optionE: headerMap['E'],
              subject: headerMap['Fach'],
              correctAnswer: headerMap['Antwort'],
              comment: headerMap['Kommentar']
            };
          });

        if (questions.length === 0) {
          toast.error("Keine gültigen Fragen in der CSV-Datei gefunden");
          return;
        }

        onQuestionsLoaded(questions);
        toast.success(`${questions.length} Fragen geladen`);
      },
      header: true,
      skipEmptyLines: true,
    });
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <h2 className="text-2xl font-semibold text-slate-800">Laden Sie Ihre Fragen hoch</h2>
      <p className="text-slate-600 mb-4">Bitte laden Sie eine CSV-Datei mit den Spalten: Frage, A, B, C, D, E, Fach, Antwort, Kommentar</p>
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