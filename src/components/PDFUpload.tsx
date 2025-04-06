import React, { useCallback, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuth } from '@/contexts/AuthContext';
import { Question, PdfProcessingTask } from '@/types/Question';
import { AlertCircle, Upload, FileText, Check, X, ArrowRight } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { supabase } from '@/integrations/supabase/client';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { showToast } from '@/utils/toast';

// Define the form schema for exam metadata
const examMetadataSchema = z.object({
  examName: z.string().min(1, "Exam name is required"),
  examYear: z.string().regex(/^\d{4}$/, "Please enter a valid year (e.g., 2024)").optional(),
  examSemester: z.enum(["WS", "SS"]).optional(),
  subject: z.string().min(1, "Subject is required")
});

type ExamMetadataFormValues = z.infer<typeof examMetadataSchema>;

// Define the props interface for PDFUpload
interface PDFUploadProps {
  onQuestionsLoaded: (questions: Question[]) => void;
  visibility: 'private' | 'university';
}

const PDFUpload: React.FC<PDFUploadProps> = ({ onQuestionsLoaded, visibility }) => {
  const { user, universityId, universityName } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showMetadataForm, setShowMetadataForm] = useState(true);
  const [activeTask, setActiveTask] = useState<PdfProcessingTask | null>(null);
  const [statusCheckInterval, setStatusCheckInterval] = useState<number | null>(null);
  
  // Initialize the form
  const form = useForm<ExamMetadataFormValues>({
    resolver: zodResolver(examMetadataSchema),
    defaultValues: {
      examName: "",
      examYear: new Date().getFullYear().toString(),
      examSemester: undefined,
      subject: ""
    }
  });

  // Clean up the interval when component unmounts or when we get results
  useEffect(() => {
    return () => {
      if (statusCheckInterval) {
        clearInterval(statusCheckInterval);
      }
    };
  }, [statusCheckInterval]);

  // When we have an active task, periodically check its status
  useEffect(() => {
    if (activeTask && activeTask.status === 'processing') {
      const intervalId = window.setInterval(async () => {
        await checkTaskStatus(activeTask.task_id);
      }, 3000); 
      
      setStatusCheckInterval(intervalId);
      
      return () => {
        clearInterval(intervalId);
      };
    }
  }, [activeTask]);

  const resetState = () => {
    setError(null);
    setIsUploading(false);
    setUploadProgress(0);
    setSelectedFile(null);
    setShowMetadataForm(true);
    setActiveTask(null);
    if (statusCheckInterval) {
      clearInterval(statusCheckInterval);
      setStatusCheckInterval(null);
    }
    form.reset();
  };

  const handleFileSelection = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setError(null);

    if (!file) {
      setError("Bitte wähle eine Datei aus");
      showToast.error("Keine Datei ausgewählt", {
        description: "Bitte wähle eine PDF-Datei aus"
      });
      return;
    }

    if (!file.name.endsWith('.pdf')) {
      setError("Bitte wähle eine PDF-Datei aus");
      showToast.error("Ungültiges Dateiformat", {
        description: "Es werden nur PDF-Dateien unterstützt"
      });
      return;
    }

    setSelectedFile(file);
    showToast.info("Datei ausgewählt", {
      description: `${file.name} wurde ausgewählt`
    });
    console.log('File selected:', file.name);
  };

  const handleMetadataSubmit = (data: ExamMetadataFormValues) => {
    console.log('Metadata submitted:', data);
    setShowMetadataForm(false);
    
    if (!selectedFile) {
      showToast.info("Bitte wähle nun eine PDF-Datei aus", {
        description: "Die Metadaten wurden erfasst"
      });
    } else {
      showToast.info("Metadaten erfasst", {
        description: "Du kannst jetzt die PDF-Datei hochladen"
      });
    }
  };

  const checkTaskStatus = async (taskId: string) => {
    try {
      console.log(`Checking status for task: ${taskId}`);
      
      const { data, error } = await supabase.functions.invoke('check-pdf-status', {
        body: { task_id: taskId },
        method: 'GET',
      });

      if (error) {
        console.error('Error from edge function:', error);
        throw new Error(error.message);
      }

      console.log('Status check response:', data);

      if (data.status === 'completed') {
        if (statusCheckInterval) {
          clearInterval(statusCheckInterval);
          setStatusCheckInterval(null);
        }
        
        setUploadProgress(100);
        setIsUploading(false);
        
        if (data.success) {
          const successMessage = data.message || "PDF erfolgreich verarbeitet und Fragen gespeichert.";
          showToast.success("Verarbeitung erfolgreich", {
            description: successMessage
          });
          resetState(); 
        } else {
          const errorMessage = data.message || data.error || "Keine Fragen konnten aus der PDF-Datei extrahiert werden oder ein Problem ist aufgetreten.";
          showToast.info("Verarbeitung abgeschlossen", { 
            description: errorMessage
          });
          resetState(); 
        }
      } else if (data.status === 'failed') {
        if (statusCheckInterval) {
          clearInterval(statusCheckInterval);
          setStatusCheckInterval(null);
        }
        
        setIsUploading(false);
        const failMessage = data.error || data.details || "Die Verarbeitung der PDF-Datei ist fehlgeschlagen";
        setError(failMessage);
        showToast.error("Verarbeitung fehlgeschlagen", {
          description: failMessage
        });
        resetState(); 
      } else {
        const currentProgress = uploadProgress;
        const newProgress = Math.min(currentProgress + 5, 95);
        setUploadProgress(newProgress);
        
        if (Math.floor(newProgress / 20) > Math.floor(currentProgress / 20)) {
          showToast.info("Verarbeitung läuft", {
            description: data.message || `Fortschritt: ${newProgress}%`
          });
        }
        
        setActiveTask({
          ...activeTask!,
          status: data.status,
          message: data.message
        });
      }
    } catch (error: any) {
      console.error('Error checking task status:', error);
      
      showToast.error("Statusabfrage fehlgeschlagen", {
        description: "Versuche es erneut in Kürze..."
      });
      
      setError(error.message || "Ein Fehler ist beim Überprüfen des Task-Status aufgetreten");
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !user?.id) {
      setError("Bitte wähle eine Datei aus und stelle sicher, dass du angemeldet bist");
      showToast.error("Upload nicht möglich", {
        description: "Bitte wähle eine Datei aus und stelle sicher, dass du angemeldet bist"
      });
      return;
    }

    const formValues = form.getValues();

    setError(null);
    setIsUploading(true);
    setUploadProgress(10);
    showToast.info("Upload gestartet", {
      description: "Deine PDF-Datei wird hochgeladen und verarbeitet..."
    });

    try {
      const formData = new FormData();
      formData.append('pdf', selectedFile);
      
      formData.append('examName', formValues.examName);
      if (formValues.examYear) formData.append('examYear', formValues.examYear);
      if (formValues.examSemester) formData.append('examSemester', formValues.examSemester);
      formData.append('subject', formValues.subject);
      if (user?.id) {
        formData.append('userId', user.id);
        console.log('Appending userId to form data:', user.id);
      } else {
        console.warn('No user.id available for form data');
      }
      formData.append('visibility', visibility);
      console.log('Appending visibility to form data:', visibility);

      const { data, error } = await supabase.functions.invoke('process-pdf', {
        body: formData,
      });

      if (error) {
        throw new Error(error.message);
      }

      console.log('Upload API response:', data);

      if (!data.success) {
        throw new Error(data.error || "Fehler beim Hochladen der PDF-Datei");
      }

      if (data.task_id) {
        setActiveTask({
          task_id: data.task_id,
          status: 'processing',
          message: data.message || 'Verarbeitung läuft...'
        });
        
        setUploadProgress(20);
        
        showToast.info("PDF-Verarbeitung gestartet", {
          description: "Die Verarbeitung kann einige Minuten dauern"
        });
        
        await checkTaskStatus(data.task_id);
      } else {
        throw new Error("Keine Task-ID vom Server erhalten");
      }
    } catch (error: any) {
      console.error('Error uploading PDF:', error);
      setError(error.message || "Ein unerwarteter Fehler ist aufgetreten");
      setIsUploading(false);
      setUploadProgress(0);
      
      showToast.error("Fehler beim Verarbeiten der PDF-Datei", {
        description: error.message || "Bitte versuche es später erneut"
      });
    }
  };

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-4xl mx-auto">
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
            {showMetadataForm ? (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleMetadataSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="examName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Prüfungsname</FormLabel>
                        <FormControl>
                          <Input placeholder="z.B. Anatomie Klausur" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="subject"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fach</FormLabel>
                        <FormControl>
                          <Input placeholder="z.B. Anatomie" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="examSemester"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Semester (Optional)</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Wähle Semester" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="WS">Wintersemester</SelectItem>
                              <SelectItem value="SS">Sommersemester</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="examYear"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Jahr (Optional)</FormLabel>
                          <FormControl>
                            <Input type="text" placeholder="z.B. 2024" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full mt-4 flex items-center justify-center gap-2"
                  >
                    Weiter zur Dateiauswahl
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </form>
              </Form>
            ) : (
              <>
                <div className="bg-muted/20 p-3 rounded-md mb-4">
                  <h3 className="font-medium mb-1">Prüfungsdaten:</h3>
                  <p className="text-sm text-muted-foreground">
                    <strong>Name:</strong> {form.getValues().examName}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    <strong>Fach:</strong> {form.getValues().subject}
                  </p>
                  {form.getValues().examSemester && (
                    <p className="text-sm text-muted-foreground">
                      <strong>Semester:</strong> {form.getValues().examSemester === 'WS' ? 'Wintersemester' : 'Sommersemester'}
                    </p>
                  )}
                  {form.getValues().examYear && (
                    <p className="text-sm text-muted-foreground">
                      <strong>Jahr:</strong> {form.getValues().examYear}
                    </p>
                  )}
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="mt-2" 
                    onClick={() => setShowMetadataForm(true)}
                  >
                    Bearbeiten
                  </Button>
                </div>
                
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
                      disabled={isUploading}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div 
                    className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-md border-muted-foreground/25 hover:border-muted-foreground/50 transition-colors cursor-pointer"
                    onClick={triggerFileInput}
                  >
                    <Upload className="h-10 w-10 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground mb-1">Klicke um eine PDF-Datei hochzuladen</p>
                    <p className="text-xs text-muted-foreground">Oder ziehe eine Datei hierher</p>
                    <input
                      id="pdf-upload"
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf"
                      onChange={handleFileSelection}
                      className="hidden"
                      disabled={isUploading}
                    />
                  </div>
                )}

                {isUploading && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{activeTask?.message || "Verarbeite PDF..."}</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} className="h-2" />
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Sichtbarkeit der Fragen</label>
                    <Select 
                      value={visibility} 
                      onValueChange={(value: 'private' | 'university') => {}}
                      disabled={isUploading || !universityId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sichtbarkeit wählen" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="private">Privat (nur für dich)</SelectItem>
                        <SelectItem value="university" disabled={!universityId}>
                          Universität (alle an deiner Uni)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    {!universityId && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Um Fragen mit deiner Uni zu teilen, verknüpfe dein Profil.
                      </p>
                    )}
                  </div>

                  <div className="pt-2 flex justify-end">
                    <Button
                      disabled={!selectedFile || isUploading}
                      onClick={handleUpload}
                      className="flex items-center gap-2"
                    >
                      {isUploading ? 'Verarbeite...' : 'PDF hochladen und analysieren'}
                      {!isUploading && <Upload className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </>
    </div>
  );
};

export default PDFUpload;
