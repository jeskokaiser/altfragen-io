
import React, { useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { Question } from '@/types/Question';
import { saveQuestions } from '@/services/DatabaseService';
import { AlertCircle, Upload, FileText, Check, X } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { supabase } from '@/integrations/supabase/client';
import PDFQuestionReview from './PDFQuestionReview';

interface PDFUploadProps {
  onQuestionsLoaded: (questions: Question[]) => void;
}

const PDFUpload: React.FC<PDFUploadProps> = ({ onQuestionsLoaded }) => {
  const { user, universityId, universityName } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [extractedQuestions, setExtractedQuestions] = useState<Question[] | null>(null);
  const [visibility, setVisibility] = useState<'private' | 'university'>('private');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadStats, setUploadStats] = useState<{
    exam_name: string;
    images_uploaded: number;
    total_questions: number;
    total_images: number;
  } | null>(null);

  const resetState = () => {
    setError(null);
    setIsUploading(false);
    setUploadProgress(0);
    setExtractedQuestions(null);
    setUploadStats(null);
    setSelectedFile(null);
  };

  const handleFileSelection = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setError(null);

    if (!file) {
      setError("Bitte wähle eine Datei aus");
      toast.error("Keine Datei ausgewählt", {
        description: "Bitte wähle eine PDF-Datei aus"
      });
      return;
    }

    if (!file.name.endsWith('.pdf')) {
      setError("Bitte wähle eine PDF-Datei aus");
      toast.error("Ungültiges Dateiformat", {
        description: "Es werden nur PDF-Dateien unterstützt"
      });
      return;
    }

    setSelectedFile(file);
    console.log('File selected:', file.name);
  };

  const handleUpload = async () => {
    if (!selectedFile || !user?.id) {
      setError("Bitte wähle eine Datei aus und stelle sicher, dass du angemeldet bist");
      return;
    }

    setError(null);
    setIsUploading(true);
    setUploadProgress(10);

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const newProgress = prev + 5;
          return newProgress < 90 ? newProgress : prev;
        });
      }, 500);

      // Create form data for the API request
      const formData = new FormData();
      formData.append('pdf', selectedFile);

      // Call the Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('process-pdf', {
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (error) {
        throw new Error(error.message);
      }

      console.log('API response:', data);

      if (!data.success || !data.questions || !Array.isArray(data.questions) || data.questions.length === 0) {
        throw new Error("Keine Fragen konnten aus der PDF-Datei extrahiert werden");
      }

      // Store the questions and stats
      setExtractedQuestions(data.questions);
      setUploadStats(data.data);
      
      // Success message
      const imagesText = data.data.images_uploaded > 0 
        ? ` und ${data.data.images_uploaded} Bilder` 
        : '';
        
      toast.success(`${data.questions.length} Fragen${imagesText} aus der PDF-Datei extrahiert`, {
        description: "Bitte überprüfe die Fragen bevor du sie speicherst"
      });

    } catch (error: any) {
      console.error('Error processing PDF:', error);
      setError(error.message || "Ein unerwarteter Fehler ist aufgetreten");
      toast.error("Fehler beim Verarbeiten der PDF-Datei", {
        description: error.message || "Bitte versuche es später erneut"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveQuestions = async (questionsToSave: Question[]) => {
    if (!user?.id) {
      setError("Du musst angemeldet sein, um Fragen zu speichern");
      return;
    }

    try {
      const savedQuestions = await saveQuestions(questionsToSave, user.id, universityId);
      onQuestionsLoaded(savedQuestions);
      
      const visibilityText = visibility === 'private' 
        ? 'privat' 
        : 'mit deiner Universität geteilt';
      
      const imagesText = uploadStats?.images_uploaded && uploadStats.images_uploaded > 0
        ? ` und ${uploadStats.images_uploaded} Bilder`
        : '';
          
      toast.success(`${questionsToSave.length} Fragen${imagesText} aus "${selectedFile?.name}" gespeichert`, {
        description: `Die Fragen wurden erfolgreich gespeichert und sind ${visibilityText}`
      });
      
      resetState();
    } catch (error: any) {
      console.error('Error saving questions:', error);
      setError(error.message || "Ein Fehler ist beim Speichern der Fragen aufgetreten");
      toast.error("Fehler beim Speichern der Fragen", {
        description: error.message || "Bitte versuche es später erneut"
      });
    }
  };

  const handleCancelReview = () => {
    setExtractedQuestions(null);
    setUploadStats(null);
    toast.info("Vorgang abgebrochen", {
      description: "Die extrahierten Fragen wurden verworfen"
    });
  };

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-4xl mx-auto">
      {/* Review extracted questions if available */}
      {extractedQuestions ? (
        <PDFQuestionReview 
          questions={extractedQuestions}
          visibility={visibility}
          onSave={handleSaveQuestions}
          onCancel={handleCancelReview}
          filename={selectedFile?.name || ''}
          stats={uploadStats}
        />
      ) : (
        <>
          <h2 className="text-2xl font-semibold text-slate-800 dark:text-zinc-50">
            Lade deine PDF-Datei hoch
          </h2>
          <p className="text-slate-600 dark:text-zinc-300 text-center">
            Lade eine PDF-Datei mit Fragen hoch. Unsere API extrahiert automatisch die Fragen, die du anschließend überprüfen kannst.
          </p>
          
          {error && (
            <Alert variant="destructive" className="mb-4 w-full max-w-md">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-xl">PDF-Upload</CardTitle>
              <CardDescription>
                {universityId 
                  ? `Du bist der Universität ${universityName || ''} zugeordnet und kannst Fragen mit anderen Studierenden teilen.`
                  : "Du bist keiner Universität zugeordnet. Um Fragen mit deiner Universität zu teilen, aktualisiere dein Profil."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedFile ? (
                <div className="flex items-center justify-between p-3 border rounded-md bg-muted/30">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="font-medium text-sm">{selectedFile.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedFile(null)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-md border-muted-foreground/25 hover:border-muted-foreground/50 transition-colors">
                  <Upload className="h-10 w-10 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground mb-1">Klicke um eine PDF-Datei hochzuladen</p>
                  <p className="text-xs text-muted-foreground">Oder ziehe eine Datei hierher</p>
                  <input
                    id="pdf-upload"
                    type="file"
                    accept=".pdf"
                    onChange={handleFileSelection}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </div>
              )}

              {isUploading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Verarbeite PDF...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} className="h-2" />
                </div>
              )}

              <div className="pt-4 flex justify-end">
                <Button
                  disabled={!selectedFile || isUploading}
                  onClick={handleUpload}
                  className="flex items-center gap-2"
                >
                  {isUploading ? 'Verarbeite...' : 'PDF hochladen und analysieren'}
                  {!isUploading && <Upload className="h-4 w-4" />}
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default PDFUpload;
