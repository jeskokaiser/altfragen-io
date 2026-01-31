import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { Question } from '@/types/Question';
import { AlertCircle, Upload, FileText, X, Lock, GraduationCap, Globe, Crown, Scan } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useNavigate } from 'react-router-dom';
import { Progress } from "@/components/ui/progress";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { showToast } from '@/utils/toast';
import { fetchQuestionsByFilename } from '@/services/DatabaseService';
import { supabase } from '@/integrations/supabase/client';

const metadataSchema = z.object({
  examName: z.string().optional(),
  examYear: z.string().optional(),
  examSemester: z.enum(["WS", "SS"]).optional(),
  subject: z.string().optional()
});

type MetadataFormValues = z.infer<typeof metadataSchema>;

interface OCRUploadProps {
  onQuestionsLoaded: (questions: Question[]) => void;
  visibility: 'private' | 'university' | 'public';
}

const OCRUpload: React.FC<OCRUploadProps> = ({ onQuestionsLoaded, visibility: initialVisibility }) => {
  const { user, universityId, universityName } = useAuth();
  const { subscribed, loading: subscriptionLoading } = useSubscription();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [visibility, setVisibility] = useState<'private' | 'university' | 'public'>(initialVisibility);

  // Generate years from 2010 to current year
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 2009 }, (_, i) => (currentYear - i).toString());

  const form = useForm<MetadataFormValues>({
    resolver: zodResolver(metadataSchema),
    defaultValues: {
      examName: "",
      examYear: new Date().getFullYear().toString(),
      examSemester: undefined,
      subject: ""
    }
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelection = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setError(null);

    if (!file) {
      setError("Bitte wähle eine Datei aus");
      showToast.error("Keine Datei ausgewählt", {
        description: "Bitte wähle eine Datei aus"
      });
      return;
    }

    // Check file type
    const validTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
    const validExtensions = ['.pdf', '.png', '.jpg', '.jpeg'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));

    if (!validTypes.includes(file.type) && !validExtensions.includes(fileExtension)) {
      setError("Bitte wähle eine PDF-, PNG- oder JPEG-Datei aus");
      showToast.error("Ungültiges Dateiformat", {
        description: "Es werden nur PDF-, PNG- und JPEG-Dateien unterstützt"
      });
      return;
    }

    // Check file size (50MB limit)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      setError("Datei ist zu groß");
      showToast.error("Datei zu groß", {
        description: "Die Datei darf maximal 50MB groß sein"
      });
      return;
    }

    setSelectedFile(file);
    showToast.info("Datei ausgewählt", {
      description: `${file.name} wurde ausgewählt`
    });
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
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
    showToast.info("OCR-Verarbeitung gestartet", {
      description: "Deine Datei wird verarbeitet..."
    });

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('userId', user.id);
      formData.append('visibility', visibility);
      
      if (universityId && visibility === 'university') {
        formData.append('universityId', universityId);
      }
      
      if (formValues.examName) {
        formData.append('examName', formValues.examName);
      }
      if (formValues.examYear) {
        formData.append('examYear', formValues.examYear);
      }
      if (formValues.examSemester) {
        formData.append('examSemester', formValues.examSemester);
      }
      if (formValues.subject) {
        formData.append('subject', formValues.subject);
      }

      setUploadProgress(30);

      // Call OCR service
      const response = await fetch('https://api.altfragen.io/ocr-service/process', {
        method: 'POST',
        body: formData
      });

      setUploadProgress(70);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setUploadProgress(90);

      if (!data.success) {
        throw new Error(data.error || "OCR-Verarbeitung fehlgeschlagen");
      }

      // Fetch the saved questions from database
      const savedQuestions = await fetchQuestionsByFilename(selectedFile.name, user.id);
      
      setUploadProgress(100);
      setIsUploading(false);

      if (savedQuestions.length > 0) {
        // Check if exam_name is provided - questions are automatically linked by exam_name
        if (formValues.examName && formValues.examName.trim()) {
          try {
            // Check if an exam with matching exam_name exists
            const sb: any = supabase;
            const { data: matchingExam } = await sb
              .from('upcoming_exams')
              .select('id, title, exam_name')
              .eq('created_by', user.id)
              .eq('exam_name', formValues.examName.trim())
              .maybeSingle();
            
            if (matchingExam) {
              showToast.success("Fragen erfolgreich extrahiert", {
                description: `${data.questions_extracted} Fragen wurden aus der Datei extrahiert, gespeichert und automatisch zur Prüfung "${matchingExam.title}" verknüpft`
              });
            } else {
              showToast.success("Fragen erfolgreich extrahiert", {
                description: `${data.questions_extracted} Fragen wurden aus der Datei extrahiert und gespeichert. Erstelle eine Prüfung mit exam_name "${formValues.examName.trim()}" um sie zu verknüpfen.`
              });
            }
          } catch (linkError) {
            // If check fails, still show success for the upload
            console.error('Error checking exam link:', linkError);
            showToast.success("Fragen erfolgreich extrahiert", {
              description: `${data.questions_extracted} Fragen wurden aus der Datei extrahiert und gespeichert`
            });
          }
        } else {
          showToast.success("Fragen erfolgreich extrahiert", {
            description: `${data.questions_extracted} Fragen wurden aus der Datei extrahiert und gespeichert`
          });
        }
        
        onQuestionsLoaded(savedQuestions);
        
        // Reset form
        setSelectedFile(null);
        form.reset();
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        showToast.warning("Keine Fragen gefunden", {
          description: "Es wurden keine Fragen in der Datei gefunden"
        });
      }
    } catch (error: any) {
      console.error('Error processing OCR:', error);
      setError(error.message || "Ein unerwarteter Fehler ist aufgetreten");
      setIsUploading(false);
      setUploadProgress(0);
      
      showToast.error("Fehler bei der OCR-Verarbeitung", {
        description: error.message || "Bitte versuche es später erneut"
      });
    }
  };

  const getUniversityContextMessage = () => {
    if (!universityId) {
      return "Du bist keiner Universität zugeordnet. Um Fragen mit deiner Universität zu teilen, aktualisiere dein Profil.";
    }
    return `Du bist der Universität ${universityName || ''} zugeordnet und kannst Fragen mit anderen Studierenden teilen.`;
  };

  // Show premium-only message for free users
  if (!subscriptionLoading && !subscribed) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Scan className="h-5 w-5" />
            OCR-Upload
          </CardTitle>
          <CardDescription>
            Premium Feature
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center py-8 space-y-4">
            <Crown className="h-16 w-16 mx-auto text-blue-500" />
            <div>
              <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">
                Premium Feature
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Der OCR-Upload ist nur für Premium-Nutzer verfügbar. Upgrade zu Premium, um Dokumente hochzuladen und automatisch Fragen zu extrahieren.
              </p>
              <Button 
                onClick={() => navigate('/subscription')} 
                className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 flex items-center gap-2 mx-auto"
              >
                <Crown className="h-4 w-4" />
                Jetzt upgraden!
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl">OCR-Upload</CardTitle>
        <CardDescription>
          {getUniversityContextMessage()}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="examName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prüfungsname (optional)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="z.B. Anatomie Klausur" 
                      {...field} 
                    />
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
                    <FormLabel>Semester (optional)</FormLabel>
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
                    <FormLabel>Jahr (optional)</FormLabel>
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

            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fach (optional)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="z.B. Anatomie" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <label className="text-sm font-medium mb-1 block">Sichtbarkeit der Fragen</label>
              <Select 
                value={visibility} 
                onValueChange={(value: 'private' | 'university' | 'public') => setVisibility(value)}
                disabled={isUploading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sichtbarkeit wählen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="private">
                    <div className="flex items-center gap-2">
                      <Lock className="h-4 w-4" />
                      <span>Privat (nur für dich)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="university" disabled={!universityId}>
                    <div className="flex items-center gap-2">
                      <GraduationCap className="h-4 w-4" />
                      <span>Universität (alle an deiner Uni)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="public" disabled={!universityId}>
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      <span>Öffentlich (alle registrierten Universitäten)</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              {!universityId && (
                <p className="text-xs text-muted-foreground mt-1">
                  Um Fragen zu teilen, verknüpfe dein Profil mit einer Universität.
                </p>
              )}
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
                <p className="text-sm text-muted-foreground mb-1">Klicke um eine Datei hochzuladen</p>
                <p className="text-xs text-muted-foreground">PDF, PNG oder JPEG (max. 50MB)</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={handleFileSelection}
                  className="hidden"
                  disabled={isUploading}
                />
              </div>
            )}

            {isUploading && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Verarbeite Dokument...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            )}

            <Button
              disabled={!selectedFile || isUploading}
              onClick={handleUpload}
              className="w-full flex items-center gap-2"
            >
              {isUploading ? 'Verarbeite...' : 'Dokument hochladen und Fragen extrahieren'}
              {!isUploading && <Upload className="h-4 w-4" />}
            </Button>
          </div>
        </Form>
      </CardContent>
    </Card>
  );
};

export default OCRUpload;

