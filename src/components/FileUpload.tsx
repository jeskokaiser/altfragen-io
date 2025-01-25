import React from 'react';
import Papa from 'papaparse';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Question } from '@/types/Question';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

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

    Papa.parse(file, {
      complete: async (results) => {
        console.log('CSV parsing results:', results);
        
        if (!results.data || results.data.length < 2) {
          toast.error("Die CSV-Datei ist leer oder ungültig");
          return;
        }

        const headers = Array.isArray(results.data[0]) ? results.data[0] : Object.keys(results.data[0]);
        console.log('CSV headers:', headers);
        
        const requiredColumns = ['Frage', 'A', 'B', 'C', 'D', 'E', 'Fach', 'Antwort', 'Kommentar'];
        
        const missingColumns = requiredColumns.filter(col => !headers.includes(col));
        
        if (missingColumns.length > 0) {
          toast.error(`Fehlende Spalten: ${missingColumns.join(', ')}`);
          return;
        }

        const questions = (results.data as any[])
          .slice(1)
          .filter(row => {
            const values = Array.isArray(row) ? row : Object.values(row);
            return values.length >= requiredColumns.length;
          })
          .map(row => {
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
          .filter(q => q.question && q.correctAnswer);

        console.log('Processed questions:', questions);

        if (questions.length === 0) {
          toast.error("Keine gültigen Fragen in der CSV-Datei gefunden");
          return;
        }

        try {
          // Save questions to Supabase
          const { error } = await supabase.from('questions').insert(
            questions.map(q => ({
              user_id: user?.id,
              question: q.question,
              option_a: q.optionA,
              option_b: q.optionB,
              option_c: q.optionC,
              option_d: q.optionD,
              option_e: q.optionE,
              subject: q.subject,
              correct_answer: q.correctAnswer,
              comment: q.comment
            }))
          );

          if (error) throw error;

          onQuestionsLoaded(questions);
          toast.success(`${questions.length} Fragen geladen und gespeichert`);
        } catch (error: any) {
          console.error('Error saving questions:', error);
          toast.error("Fehler beim Speichern der Fragen: " + error.message);
        }
      },
      header: false,
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