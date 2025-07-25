
import React, { useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Question } from '@/types/Question';
import { useAuth } from '@/contexts/AuthContext';
import { parseCSV } from '@/utils/CSVParser';
import { mapRowsToQuestions } from '@/utils/QuestionMapper';
import { saveQuestions } from '@/services/DatabaseService';
import { AlertCircle, Lock, GraduationCap, FileText, FileUp, Files } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import PDFUpload from './PDFUpload';
import BatchPDFUpload from './BatchPDFUpload';

interface FileUploadProps {
  onQuestionsLoaded: (questions: Question[]) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onQuestionsLoaded }) => {
  const { user, universityId, universityName } = useAuth();
  const [error, setError] = React.useState<string | null>(null);
  const [visibility, setVisibility] = useState<'private' | 'university'>('private');
  const [uploadType, setUploadType] = useState<'csv' | 'pdf' | 'batch-pdf'>('csv');

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setError(null);

    if (!file) {
      setError("Bitte wähle eine Datei aus");
      toast.error("Keine Datei ausgewählt", {
        description: "Bitte wähle eine CSV-Datei aus"
      });
      return;
    }

    if (!file.name.endsWith('.csv')) {
      setError("Bitte wähle eine CSV-Datei aus");
      toast.error("Ungültiges Dateiformat", {
        description: "Es werden nur CSV-Dateien unterstützt"
      });
      return;
    }

    console.log('File selected:', file.name);

    try {
      const { headers, rows } = await parseCSV(file);
      const questions = mapRowsToQuestions(rows, headers, file.name);

      console.log('Total valid questions:', questions.length);

      if (questions.length === 0) {
        setError("Die CSV-Datei enthält keine gültigen Fragen");
        toast.error("Keine gültigen Fragen gefunden", {
          description: "Überprüfe das Format deiner CSV-Datei"
        });
        return;
      }

      const questionsWithVisibility = questions.map(q => ({
        ...q,
        visibility
      }));

      const savedQuestions = await saveQuestions(questionsWithVisibility, user?.id || '', universityId);
      onQuestionsLoaded(savedQuestions);
      
      const visibilityText = visibility === 'private' 
        ? 'privat' 
        : 'mit deiner Universität geteilt';
          
      toast.success(`${questions.length} Fragen aus "${file.name}" geladen`, {
        description: `Die Fragen wurden erfolgreich gespeichert und sind ${visibilityText}`
      });
    } catch (error: any) {
      console.error('Error processing file:', error);
      const errorMessage = error.message || "Ein unerwarteter Fehler ist aufgetreten";
      setError(errorMessage);
      toast.error("Fehler beim Verarbeiten der Datei", {
        description: errorMessage
      });
    }
  }, [user, universityId, onQuestionsLoaded, visibility]);

  const renderVisibilityIcon = () => {
    switch (visibility) {
      case 'university':
        return <GraduationCap className="h-4 w-4" />;
      default:
        return <Lock className="h-4 w-4" />;
    }
  };

  const getUniversityContextMessage = () => {
    if (!universityId) {
      return "Du bist keiner Universität zugeordnet. Um Fragen mit deiner Universität zu teilen, aktualisiere dein Profil.";
    }
    return `Du bist der Universität ${universityName || ''} zugeordnet und kannst Fragen mit anderen Studierenden teilen.`;
  };

  const handlePDFQuestionsLoaded = (questions: Question[]) => {
    // PDF questions already have visibility set in the review component
    onQuestionsLoaded(questions);
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <h2 className="text-2xl font-semibold text-slate-800 dark:text-zinc-50">
        Lade deine Fragen hoch
      </h2>
      <p className="text-slate-600 dark:text-zinc-300 mb-4">
        Bitte wähle ein Format und lade deine Fragen hoch
      </p>
      
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="csv" className="w-full max-w-4xl">
        <TabsList className="grid grid-cols-2">
          <TabsTrigger 
            value="csv" 
            onClick={() => setUploadType('csv')}
            className="flex items-center gap-2"
          >
            <FileText className="h-4 w-4" />
            CSV-Datei
          </TabsTrigger>
          <TabsTrigger 
            value="batch-pdf" 
            onClick={() => setUploadType('batch-pdf')}
            className="flex items-center gap-2"
          >
            <Files className="h-4 w-4" />
            Batch Dokumente
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="csv">
          <Card className="w-full">
            <CardHeader>
              <CardTitle className="text-xl">CSV Upload</CardTitle>
              <CardDescription>
                {getUniversityContextMessage()}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="flex flex-col gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Sichtbarkeit der Fragen</label>
                  <Select 
                    value={visibility} 
                    onValueChange={(value: 'private' | 'university') => setVisibility(value)}
                  >
                    <SelectTrigger className="w-full">
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
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-center mt-2">
                  <label htmlFor="csv-upload">
                    <Button 
                      variant="outline" 
                      className="cursor-pointer hover:bg-slate-100 dark:hover:bg-zinc-800"
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
                
                <div className="mt-2 p-4 bg-muted/50 rounded-lg text-xs text-muted-foreground">
                  <p>Die CSV-Datei sollte folgende Spalten enthalten:</p>
                  <p className="font-mono mt-1">Frage, A, B, C, D, E, Fach, Antwort, Kommentar</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="pdf">
          <PDFUpload 
            onQuestionsLoaded={handlePDFQuestionsLoaded} 
            visibility={visibility}
          />
        </TabsContent>

        <TabsContent value="batch-pdf">
          <BatchPDFUpload 
            onQuestionsLoaded={handlePDFQuestionsLoaded} 
            visibility={visibility}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FileUpload;
