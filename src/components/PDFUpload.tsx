import React, { useCallback, useState, useEffect, useRef, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuth } from '@/contexts/AuthContext';
import { Question, PdfProcessingTask } from '@/types/Question';
import { AlertCircle, Upload, FileText, Check, X, ArrowRight, Search } from 'lucide-react';
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
import { Popover, PopoverContent, PopoverAnchor } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import PDFQuestionReview from './PDFQuestionReview';

const examMetadataSchema = z.object({
  examName: z.string().min(1, "Exam name is required"),
  examYear: z.string().min(1, "Jahr ist erforderlich"),
  examSemester: z.enum(["WS", "SS"], { required_error: "Semester ist erforderlich" })
});

type ExamMetadataFormValues = z.infer<typeof examMetadataSchema>;

interface PDFUploadProps {
  onQuestionsLoaded: (questions: Question[]) => void;
  visibility: 'private' | 'university';
}

const PDFUpload: React.FC<PDFUploadProps> = ({ onQuestionsLoaded, visibility: initialVisibility }) => {
  const { user, universityId, universityName } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showMetadataForm, setShowMetadataForm] = useState(true);
  const [activeTask, setActiveTask] = useState<PdfProcessingTask | null>(null);
  const [visibility, setVisibility] = useState<'private' | 'university'>(initialVisibility);
  const [examNameSuggestions, setExamNameSuggestions] = useState<string[]>([]);
  const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [extractedQuestions, setExtractedQuestions] = useState<Question[] | null>(null);
  const [processingStats, setProcessingStats] = useState<any>(null);
  
  const taskIdRef = useRef<string | null>(null);
  const intervalIdRef = useRef<number | null>(null);

  // Generate years from 2010 to current year
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 2009 }, (_, i) => (currentYear - i).toString());

  const form = useForm<ExamMetadataFormValues>({
    resolver: zodResolver(examMetadataSchema),
    defaultValues: {
      examName: "",
      examYear: new Date().getFullYear().toString(),
      examSemester: undefined
    }
  });

  const examNameValue = form.watch('examName');

  useEffect(() => {
    if (examNameValue.length >= 2) {
      fetchExamNameSuggestions(examNameValue);
      setShowSuggestions(true);
    } else {
      setExamNameSuggestions([]);
      setShowSuggestions(false);
    }
  }, [examNameValue]);

  const fetchExamNameSuggestions = async (searchTerm: string) => {
    if (!user?.id) return;
    
    setIsFetchingSuggestions(true);
    try {
      const { data, error } = await supabase
        .from('questions')
        .select('exam_name')
        .ilike('exam_name', `%${searchTerm}%`)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      
      const uniqueExamNames = [...new Set(data
        .filter(item => item.exam_name)
        .map(item => item.exam_name as string))];
        
      setExamNameSuggestions(uniqueExamNames);
    } catch (error) {
      console.error('Error fetching exam name suggestions:', error);
    } finally {
      setIsFetchingSuggestions(false);
    }
  };

  const handleSelectExamName = (examName: string) => {
    form.setValue('examName', examName);
    setShowSuggestions(false);
  };

  useEffect(() => {
    return () => {
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
        intervalIdRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (activeTask && activeTask.status === 'processing') {
      taskIdRef.current = activeTask.task_id;
      
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
      }
      
      const intervalId = window.setInterval(async () => {
        if (taskIdRef.current) {
          await checkTaskStatus(taskIdRef.current);
        } else {
          console.error('No task_id available for status check');
          clearInterval(intervalId);
        }
      }, 3000);
      
      intervalIdRef.current = intervalId;
      
      return () => {
        clearInterval(intervalId);
        intervalIdRef.current = null;
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
    setExtractedQuestions(null);
    setProcessingStats(null);
    taskIdRef.current = null;
    
    if (intervalIdRef.current) {
      clearInterval(intervalIdRef.current);
      intervalIdRef.current = null;
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

  const fetchSavedQuestions = async (filename: string) => {
    try {
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('user_id', user?.id)
        .eq('filename', filename)
        .order('created_at', { ascending: true });

      if (error) throw error;

      return data.map(q => ({
        id: q.id,
        question: q.question,
        optionA: q.option_a,
        optionB: q.option_b,
        optionC: q.option_c,
        optionD: q.option_d,
        optionE: q.option_e,
        subject: q.subject,
        correctAnswer: q.correct_answer,
        comment: q.comment,
        filename: q.filename,
        difficulty: q.difficulty,
        is_unclear: q.is_unclear,
        marked_unclear_at: q.marked_unclear_at,
        university_id: q.university_id,
        visibility: (q.visibility as 'private' | 'university') || 'private',
        user_id: q.user_id,
        semester: q.exam_semester || null,
        year: q.exam_year || null,
        image_key: q.image_key || null,
        show_image_after_answer: q.show_image_after_answer || false,
        exam_name: q.exam_name || null
      }));
    } catch (error) {
      console.error('Error fetching saved questions:', error);
      return [];
    }
  };

  const checkTaskStatus = async (taskId: string) => {
    try {
      console.log(`Checking status for task: ${taskId}`);
      
      const { data, error } = await supabase.functions.invoke(`check-pdf-status?task_id=${taskId}`, {
        method: 'GET'
      });

      if (error) {
        console.error('Error from edge function:', error);
        throw new Error(error.message);
      }

      console.log('Status check response:', data);

      if (data.status === 'completed') {
        if (intervalIdRef.current) {
          clearInterval(intervalIdRef.current);
          intervalIdRef.current = null;
        }
        
        taskIdRef.current = null;
        
        setUploadProgress(100);
        setIsUploading(false);
        
        if (data.success && selectedFile) {
          // Fetch the questions that were saved to the database by the API
          const savedQuestions = await fetchSavedQuestions(selectedFile.name);
          
          if (savedQuestions.length > 0) {
            setExtractedQuestions(savedQuestions);
            setProcessingStats(data.data);
            showToast.success("PDF verarbeitet", {
              description: "Bitte überprüfe die extrahierten Fragen"
            });
          } else {
            showToast.info("Verarbeitung abgeschlossen", { 
              description: "Keine Fragen wurden aus der PDF-Datei extrahiert"
            });
            resetState();
          }
        } else {
          const errorMessage = data.message || data.error || "Keine Fragen konnten aus der PDF-Datei extrahiert werden oder ein Problem ist aufgetreten.";
          showToast.info("Verarbeitung abgeschlossen", { 
            description: errorMessage
          });
          resetState(); 
        }
      } else if (data.status === 'failed') {
        if (intervalIdRef.current) {
          clearInterval(intervalIdRef.current);
          intervalIdRef.current = null;
        }
        
        taskIdRef.current = null;
        
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
        
        setActiveTask(prevState => ({
          ...(prevState || { task_id: taskId, status: 'processing', message: '' }),
          status: data.status,
          message: data.message
        }));
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
        taskIdRef.current = data.task_id;
        
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

  const handleReviewSave = async (reviewedQuestions: Question[]) => {
    try {
      // Update questions in the database instead of creating new ones
      for (const question of reviewedQuestions) {
        const { error } = await supabase
          .from('questions')
          .update({
            question: question.question,
            option_a: question.optionA,
            option_b: question.optionB,
            option_c: question.optionC,
            option_d: question.optionD,
            option_e: question.optionE,
            subject: question.subject,
            correct_answer: question.correctAnswer,
            comment: question.comment,
            difficulty: question.difficulty,
            visibility: question.visibility,
            university_id: question.visibility === 'university' ? universityId : null,
            exam_semester: question.semester,
            exam_year: question.year,
            exam_name: question.exam_name
          })
          .eq('id', question.id);

        if (error) {
          console.error('Error updating question:', error);
          throw error;
        }
      }
      
      onQuestionsLoaded(reviewedQuestions);
      
      showToast.success(`${reviewedQuestions.length} Fragen aktualisiert`, {
        description: "Die Fragen wurden erfolgreich in der Datenbank aktualisiert"
      });
      
      resetState();
    } catch (error: any) {
      console.error('Error updating questions:', error);
      showToast.error("Fehler beim Aktualisieren", {
        description: error.message || "Die Fragen konnten nicht aktualisiert werden"
      });
    }
  };

  const handleReviewCancel = () => {
    // Questions are already saved, just notify parent about them
    if (extractedQuestions) {
      onQuestionsLoaded(extractedQuestions);
    }
    resetState();
  };

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // If we have extracted questions, show the review interface
  if (extractedQuestions) {
    return (
      <div className="flex flex-col items-center gap-6 w-full max-w-4xl mx-auto">
        <PDFQuestionReview
          questions={extractedQuestions}
          visibility={visibility}
          onSave={handleReviewSave}
          onCancel={handleReviewCancel}
          filename={selectedFile?.name || 'PDF'}
          stats={processingStats}
          isEditMode={true}
        />
      </div>
    );
  }

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
                  <Popover open={showSuggestions && examNameSuggestions.length > 0} onOpenChange={setShowSuggestions}>
                    <FormField
                      control={form.control}
                      name="examName"
                      render={({ field }) => (
                        <FormItem className="relative">
                          <FormLabel>Prüfungsname *</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <PopoverAnchor>
                                <Input 
                                  placeholder="z.B. Anatomie Klausur" 
                                  {...field} 
                                  autoComplete="off"
                                />
                              </PopoverAnchor>
                              {isFetchingSuggestions && (
                                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground animate-pulse" />
                              )}
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <PopoverContent 
                      className="p-0 w-[var(--radix-popover-trigger-width)] max-h-[300px] overflow-y-auto" 
                      align="start"
                      side="bottom"
                    >
                      <Command>
                        <CommandList>
                          <CommandGroup>
                            {examNameSuggestions.map((name) => (
                              <CommandItem 
                                key={name} 
                                onSelect={() => handleSelectExamName(name)}
                                className="cursor-pointer"
                              >
                                {name}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                        <CommandEmpty>Keine Vorschläge gefunden</CommandEmpty>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="examSemester"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Semester *</FormLabel>
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
                          <FormLabel>Jahr *</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Jahr wählen" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {years.map((year) => (
                                <SelectItem key={year} value={year}>
                                  {year}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
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
                    <strong>Semester:</strong> {form.getValues().examSemester === 'WS' ? 'Wintersemester' : 'Sommersemester'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    <strong>Jahr:</strong> {form.getValues().examYear}
                  </p>
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
                      onValueChange={(value: 'private' | 'university') => setVisibility(value)}
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
