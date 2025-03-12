import React, { useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Question } from '@/types/Question';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { AlertCircle, FileQuestion, Info } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface FileUploadProps {
  onQuestionsLoaded: (questions: Question[]) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onQuestionsLoaded }) => {
  const { user, universityId } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [detailedError, setDetailedError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingStage, setProcessingStage] = useState<string | null>(null);
  const [showErrorDetails, setShowErrorDetails] = useState(false);
  const [showFunctionLogs, setShowFunctionLogs] = useState(false);
  const [functionLogs, setFunctionLogs] = useState<string | null>(null);
  const [showVerifyDialog, setShowVerifyDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const verifyAndUploadFile = (file: File) => {
    setSelectedFile(file);
    setShowVerifyDialog(true);
  };

  const confirmUpload = () => {
    if (selectedFile) {
      setShowVerifyDialog(false);
      executeFileUpload(selectedFile);
    }
  };

  const cancelUpload = () => {
    setSelectedFile(null);
    setShowVerifyDialog(false);
  };

  const executeFileUpload = useCallback(async (file: File) => {
    setError(null);
    setDetailedError(null);
    setFunctionLogs(null);
    setUploadProgress(0);
    setProcessingStage(null);
    setRetryCount(prevCount => prevCount + 1);

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
      setProcessingStage("Datei wird vorbereitet...");
      
      // Generate a unique file path
      const timestamp = new Date().getTime();
      const filePath = `${user?.id}/${timestamp}_${file.name}`;
      
      // Start with file validation
      setUploadProgress(5);
      setProcessingStage("Datei wird validiert...");
      
      // Validate file size
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        throw new Error("Die Datei ist zu groß (max. 10 MB)");
      }
      
      // Validate file type more thoroughly
      const fileReader = new FileReader();
      const headerCheck = new Promise<void>((resolve, reject) => {
        fileReader.onloadend = (e) => {
          try {
            const arr = new Uint8Array(e.target?.result as ArrayBuffer).subarray(0, 5);
            const header = Array.from(arr).map(byte => String.fromCharCode(byte)).join('');
            if (header !== '%PDF-') {
              reject(new Error("Die Datei scheint kein gültiges PDF zu sein"));
            } else {
              resolve();
            }
          } catch (err) {
            reject(new Error("Fehler beim Überprüfen des PDF-Formats"));
          }
        };
        fileReader.onerror = () => reject(new Error("Fehler beim Lesen der Datei"));
        fileReader.readAsArrayBuffer(file.slice(0, 5));
      });
      
      await headerCheck;
      
      // Upload file
      setUploadProgress(10);
      setProcessingStage("Datei wird hochgeladen...");
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('temp_pdfs')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw new Error(`Fehler beim Hochladen der PDF: ${uploadError.message}`);
      }
      
      setUploadProgress(40);
      setProcessingStage("PDF wird verarbeitet...");

      // Process PDF using Edge function
      // Add request ID for tracking in logs
      const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
      console.log(`Starting process-pdf function call with requestId: ${requestId}`);
      
      const { data: processedData, error: processError } = await supabase.functions
        .invoke('process-pdf', {
          body: {
            pdfUrl: filePath,
            filename: file.name,
            userId: user?.id,
            universityId,
            requestId
          }
        });

      if (processError) {
        console.error('Process error:', processError);
        // Try to check for function logs
        try {
          // This is just to show we're handling the error now
          setProcessingStage("Fehler beim Verarbeiten. Sammle Diagnose-Informationen...");
          setUploadProgress(45);
          
          // Store detailed error for dialog
          setDetailedError(processError.message || "Unbekannter Fehler bei der Verarbeitung");
          
          // Check if the error contains any JSON data that might have details
          if (typeof processError.message === 'string') {
            try {
              // Sometimes error messages can contain JSON
              const matches = processError.message.match(/\{.*\}/);
              if (matches) {
                const errorJson = JSON.parse(matches[0]);
                if (errorJson.error) {
                  setDetailedError(errorJson.error);
                }
                if (errorJson.details) {
                  setFunctionLogs(JSON.stringify(errorJson.details, null, 2));
                }
              }
            } catch (jsonError) {
              // Failed to parse error as JSON, just continue
            }
          }
          
        } catch (logError) {
          console.error('Error getting function logs:', logError);
        }
        
        throw new Error(`Fehler beim Verarbeiten der PDF: ${processError.message}`);
      }

      if (!processedData) {
        throw new Error("Keine Daten vom Server erhalten");
      }

      setUploadProgress(90);
      setProcessingStage("Fragen werden geladen...");

      const { questions } = processedData;
      
      if (!questions || questions.length === 0) {
        throw new Error("Keine Fragen im PDF gefunden");
      }

      setUploadProgress(100);
      onQuestionsLoaded(questions);
      toast.success(`${questions.length} Fragen aus "${file.name}" geladen`);

    } catch (error: any) {
      console.error('Error processing file:', error);
      const errorMessage = error.message || "Ein unerwarteter Fehler ist aufgetreten";
      setError(errorMessage);
      
      // If the error happens during PDF processing (after 40% progress), 
      // it's likely a content parsing issue
      if (uploadProgress >= 40) {
        if (!detailedError) {
          setDetailedError("Das PDF konnte nicht verarbeitet werden. Mögliche Gründe: " +
            "Falsches Format, beschädigte Datei, oder nicht unterstützte PDF-Struktur. " +
            "Bitte stelle sicher, dass dein PDF korrekt formatiert ist und dem Beispielformat entspricht.");
        }
      }
      
      toast.error("Fehler beim Verarbeiten der Datei", {
        description: errorMessage
      });
    } finally {
      setIsUploading(false);
      // Keep progress at failed point for better UX feedback
      // Only reset after starting a new upload
      
      // Reset form so the same file can be selected again
      const fileInput = document.getElementById('pdf-upload') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
      
      // Keep processing stage for error context
    }
  }, [user, universityId, onQuestionsLoaded, detailedError, uploadProgress]);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Instead of immediately processing, show verification dialog
      verifyAndUploadFile(file);
    }
  }, []);

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
        <Alert variant="destructive" className="mb-4 w-full max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex flex-col">
            <span>{error}</span>
            <div className="flex gap-2 mt-2">
              {detailedError && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="self-start text-xs"
                  onClick={() => setShowErrorDetails(true)}
                >
                  Details anzeigen
                </Button>
              )}
              {(uploadProgress >= 40 && error.includes("Verarbeiten")) && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="self-start text-xs"
                  onClick={() => setShowFunctionLogs(true)}
                >
                  Debug-Info anzeigen
                </Button>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {isUploading && (
        <div className="w-full max-w-md">
          <Progress value={uploadProgress} className="mb-2" />
          <p className="text-sm text-center text-slate-500">
            {processingStage || "Wird verarbeitet..."} {Math.round(uploadProgress)}%
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
        key={`file-input-${retryCount}`} // Force re-render to reset the input
      />
      
      {/* Verification Dialog */}
      <AlertDialog open={showVerifyDialog} onOpenChange={setShowVerifyDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>PDF hochladen bestätigen</AlertDialogTitle>
            <AlertDialogDescription>
              Du bist dabei die Datei "{selectedFile?.name}" hochzuladen.
              
              <Alert className="mt-4">
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <p>Bitte stelle sicher, dass dein PDF:</p>
                  <ul className="list-disc pl-5 mt-2 space-y-1">
                    <li>Das richtige Format hat (Frage: ..., A) ..., B) ..., Antwort: ...)</li>
                    <li>Keine Bilder oder Scans enthält</li>
                    <li>Nicht passwortgeschützt ist</li>
                    <li>Nicht beschädigt ist</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelUpload}>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={confirmUpload}>Hochladen</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Error Details Dialog */}
      <Dialog open={showErrorDetails} onOpenChange={setShowErrorDetails}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Fehlerdetails</DialogTitle>
            <DialogDescription>
              {detailedError && (
                <div className="mt-4 p-4 bg-gray-100 dark:bg-zinc-800 rounded text-sm overflow-auto max-h-80">
                  {detailedError}
                  
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-zinc-700">
                    <h4 className="font-medium mb-2">Hinweise zur Behebung:</h4>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Stelle sicher, dass das PDF nicht passwortgeschützt ist</li>
                      <li>Versuche, das PDF neu zu erstellen oder zu exportieren</li>
                      <li>Überprüfe, ob das PDF dem geforderten Format entspricht</li>
                      <li>Versuche, eine kleinere Datei (weniger Seiten) hochzuladen</li>
                      <li>Prüfe, ob das PDF kopierbare Texte enthält (nicht nur Bilder/Scans)</li>
                    </ul>
                  </div>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>

      {/* Function Logs Dialog */}
      <Dialog open={showFunctionLogs} onOpenChange={setShowFunctionLogs}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileQuestion className="h-5 w-5" />
              Diagnose-Informationen
            </DialogTitle>
          </DialogHeader>
          
          <div className="bg-gray-100 dark:bg-zinc-800 rounded-md p-4 mt-2">
            <h3 className="font-medium mb-2">Verarbeitungsdetails:</h3>
            <div className="text-sm rounded overflow-x-auto">
              <p>Datei: {selectedFile?.name}</p>
              <p>Größe: {selectedFile ? (selectedFile.size / 1024).toFixed(2) + ' KB' : 'Unbekannt'}</p>
              <p>Typ: {selectedFile?.type || 'Unbekannt'}</p>
              <p>Zuletzt verarbeitet: {new Date().toLocaleString()}</p>
              <p>Verarbeitungsstatus: {processingStage}</p>
              <p>Fehler: {error}</p>
            </div>
            
            {functionLogs && (
              <>
                <h3 className="font-medium mt-4 mb-2">Fehlerdetails vom Server:</h3>
                <pre className="text-xs bg-gray-200 dark:bg-zinc-900 p-3 rounded overflow-x-auto max-h-60">
                  {functionLogs}
                </pre>
              </>
            )}
            
            <h3 className="font-medium mt-4 mb-2">Mögliche Lösungen:</h3>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li>Verwende ein anderes PDF, das einfacher formatiert ist</li>
              <li>Speichere das PDF mit einem anderen PDF-Editor</li>
              <li>Teile das PDF in kleinere Dateien auf</li>
              <li>Kopiere den Inhalt in ein Textdokument und exportiere es erneut als PDF</li>
              <li>Stelle sicher, dass der Text im PDF kopierbar ist (keine Scans oder Bilder)</li>
            </ul>
          </div>
          
          <DialogFooter className="mt-4">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowFunctionLogs(false);
                
                // Reset state for a fresh attempt
                setError(null);
                setDetailedError(null);
                setFunctionLogs(null);
                setUploadProgress(0);
                setProcessingStage(null);
              }}
            >
              Schließen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FileUpload;

