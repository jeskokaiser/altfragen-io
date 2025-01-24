import React from 'react';
import Papa from 'papaparse';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface FileUploadProps {
  onQuestionsLoaded: (questions: Array<{ question: string; answer: string }>) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onQuestionsLoaded }) => {
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      complete: (results) => {
        const headers = results.data[0] as string[];
        const questionIndex = headers.findIndex(h => h.toLowerCase() === 'question');
        const answerIndex = headers.findIndex(h => h.toLowerCase() === 'answer');

        if (questionIndex === -1 || answerIndex === -1) {
          toast.error("CSV must contain 'question' and 'answer' columns");
          return;
        }

        const questions = (results.data as string[][])
          .slice(1) // Skip header row
          .filter(row => row[questionIndex] && row[answerIndex]) // Filter out empty rows
          .map(row => ({
            question: row[questionIndex],
            answer: row[answerIndex]
          }));

        if (questions.length === 0) {
          toast.error("No valid questions found in CSV");
          return;
        }

        onQuestionsLoaded(questions);
        toast.success(`Loaded ${questions.length} questions`);
      },
      header: true,
      skipEmptyLines: true,
    });
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <h2 className="text-2xl font-semibold text-slate-800">Upload Your Questions</h2>
      <p className="text-slate-600 mb-4">Please upload a CSV file with question and answer columns</p>
      <label htmlFor="csv-upload">
        <Button 
          variant="outline" 
          className="cursor-pointer hover:bg-slate-100"
          onClick={() => document.getElementById('csv-upload')?.click()}
        >
          Choose CSV File
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