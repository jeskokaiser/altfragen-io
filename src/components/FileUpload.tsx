
import React, { useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Question } from '@/types/Question';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";

interface FileUploadProps {
  onQuestionsLoaded: (questions: Question[]) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onQuestionsLoaded }) => {
  const { user, universityId } = useAuth();
  const [error, setError] = React.useState<string | null>(null);
  const [isUploading, setIsUploading] = React.useState(false);
  const [uploadProgress, setUploadProgress] = React.useState(0);

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setError(null);
    setUploadProgress(0);

    if (!file) {
      setError("Bitte wähle eine Datei aus");
      toast.error("Keine Datei ausgewählt");
      return;
    }

    if (!file.name.endsWith('.pdf')) {
      setError("Bitte wähle eine PDF-Datei aus");
      toast.error("Ungültiges Dateiformat", {
        description: "Es werden nur PDF-Dateien unterstützt"
      });
      return;
    }

    try {
      setIsUploading(true);
      
      // Upload PDF to temp storage
      const timestamp = new Date().getTime();
      const filePath = `${user?.id}/${timestamp}_${file.name}`;
      
      // Create XHR to track upload progress
      const xhr = new XMLHttpRequest();
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const percent = (event.loaded / event.total) * 100;
          setUploadProgress(percent);
        }
      });

      // Upload file using standard options
      const { data: uploadData, error: uploadError } = await supabase
        .storage
        .from('temp_pdfs')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw new Error(`Error uploading PDF: ${uploadError.message}`);

      // Process PDF using Edge function
      const { data: processedData, error: processError } = await supabase.functions
        .invoke('process-pdf', {
          body: {
            pdfUrl: filePath,
            filename: file.name,
            userId: user?.id,
            universityId
          }
        });

      if (processError) throw new Error(`Error processing PDF: ${processError.message}`);

      const { questions } = processedData;
      
      if (!questions || questions.length === 0) {
        throw new Error("Keine Fragen im PDF gefunden");
      }

      onQuestionsLoaded(questions);
      toast.success(`${questions.length} Fragen aus "${file.name}" geladen`);

    } catch (error: any) {
      console.error('Error processing file:', error);
      const errorMessage = error.message || "Ein unerwarteter Fehler ist aufgetreten";
      setError(errorMessage);
      toast.error("Fehler beim Verarbeiten der Datei", {
        description: errorMessage
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [user, universityId, onQuestionsLoaded]);

  return (
    <div className="flex flex-col items-center gap-4">
      <h2 className="text-2xl font-semibold text-slate-800 dark:text-zinc-50">
        Lade deine Fragen hoch
      </h2>
      <p className="text-slate-600 dark:text-zinc-300 mb-4">
        Bitte lade eine PDF-Datei mit deinen Fragen hoch. Das Format sollte wie folgt sein:
        <br />
        Frage: [Fragetext]
        <br />
        A) [Option A]
        <br />
        B) [Option B]
        <br />
        ...
        <br />
        Antwort: [Korrekte Antwort]
      </p>
      
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isUploading && (
        <div className="w-full max-w-xs">
          <Progress value={uploadProgress} className="mb-2" />
          <p className="text-sm text-center text-slate-500">
            Verarbeite PDF... {Math.round(uploadProgress)}%
          </p>
        </div>
      )}

      <label htmlFor="pdf-upload">
        <Button 
          variant="outline" 
          className="cursor-pointer hover:bg-slate-100 dark:hover:bg-zinc-800"
          onClick={() => document.getElementById('pdf-upload')?.click()}
          disabled={isUploading}
        >
          {isUploading ? 'Wird hochgeladen...' : 'PDF-Datei auswählen'}
        </Button>
      </label>
      <input
        id="pdf-upload"
        type="file"
        accept=".pdf"
        onChange={handleFileUpload}
        className="hidden"
        disabled={isUploading}
      />
    </div>
  );
};

export default FileUpload;
