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
    if (!file) {
      toast.error("Keine Datei ausgewählt");
      return;
    }

    console.log('File selected:', file.name);

    Papa.parse(file, {
      complete: (results) => {
        console.log('CSV parsing results:', results);
        
        if (!results.data || results.data.length < 2) {
          toast.error("Die CSV-Datei ist leer oder ungültig");
          return;
        }

        // Ensure headers is an array and get the first row
        const headers = Array.isArray(results.data[0]) ? results.data[0] : Object.keys(results.data[0]);
        console.log('CSV headers:', headers);
        
        const requiredColumns = ['Frage', 'A', 'B', 'C', 'D', 'E', 'Fach', 'Antwort', 'Kommentar'];
        
        // Check if all required columns exist in headers
        const missingColumns = requiredColumns.filter(col => !headers.includes(col));
        
        if (missingColumns.length > 0) {
          toast.error(`Fehlende Spalten: ${missingColumns.join(', ')}`);
          return;
        }

        // Process the data rows
        const questions = (results.data as any[])
          .slice(1) // Skip header row
          .filter(row => {
            // Handle both array and object formats
            const values = Array.isArray(row) ? row : Object.values(row);
            return values.length >= requiredColumns.length;
          })
          .map(row => {
            // Convert row to object if it's an array
            const rowData = Array.isArray(row) 
              ? headers.reduce((acc, header, index) => {
                  acc[header] = row[index];
                  return acc;
                }, {} as Record<string, string>)
              : row;

            return {
              question: rowData['Frage'],
              optionA: rowData['A'],
              optionB: rowData['B'],
              optionC: rowData['C'],
              optionD: rowData['D'],
              optionE: rowData['E'],
              subject: rowData['Fach'],
              correctAnswer: rowData['Antwort'],
              comment: rowData['Kommentar']
            };
          })
          .filter(q => q.question && q.correctAnswer); // Filter out invalid questions

        console.log('Processed questions:', questions);

        if (questions.length === 0) {
          toast.error("Keine gültigen Fragen in der CSV-Datei gefunden");
          return;
        }

        onQuestionsLoaded(questions);
        toast.success(`${questions.length} Fragen geladen`);
      },
      header: false, // We'll handle headers manually
      skipEmptyLines: true,
      error: (error) => {
        console.error('CSV parsing error:', error);
        toast.error("Fehler beim Lesen der CSV-Datei");
      }
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