
import React, { useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { parseCSV } from '@/utils/CSVParser';
import { mapRowsToQuestions } from '@/utils/QuestionMapper';
import { saveQuestions } from '@/services/DatabaseService';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useLoadingState } from '@/hooks/use-loading-state';
import { showToast } from '@/utils/toast';
import { useQueryClient } from '@tanstack/react-query';
import { Question } from '@/types/models/Question';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useQuery } from '@tanstack/react-query';
import { getUserOrganization, isOrganizationWhitelisted } from '@/services/OrganizationService';

interface FileUploadProps {
  onQuestionsLoaded: (questions: Question[]) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onQuestionsLoaded }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [error, setError] = React.useState<string | null>(null);
  const [shareWithOrganization, setShareWithOrganization] = useState(false);
  
  const { isLoading, execute } = useLoadingState<Question[]>();
  
  // Get user organization and check if it's whitelisted
  const { data: userOrg } = useQuery({
    queryKey: ['user-organization', user?.id],
    queryFn: () => getUserOrganization(user?.id || ''),
    enabled: !!user?.id
  });

  const isOrgWhitelisted = userOrg?.is_whitelisted || false;

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setError(null);

    if (!file) {
      setError("Bitte wähle eine Datei aus");
      showToast.error("Keine Datei ausgewählt", {
        description: "Bitte wähle eine CSV-Datei aus"
      });
      return;
    }

    if (!file.name.endsWith('.csv')) {
      setError("Bitte wähle eine CSV-Datei aus");
      showToast.error("Ungültiges Dateiformat", {
        description: "Es werden nur CSV-Dateien unterstützt"
      });
      return;
    }

    console.log('File selected:', file.name);
    console.log('Sharing with organization:', shareWithOrganization);

    if (shareWithOrganization && !isOrgWhitelisted) {
      setError("Deine Organisation ist nicht für das Teilen freigegeben");
      showToast.error("Organisation nicht freigegeben", {
        description: "Deine Organisation ist nicht für das Teilen freigegeben. Bitte kontaktiere den Administrator."
      });
      return;
    }

    execute(async () => {
      const { headers, rows } = await parseCSV(file);
      const questions = mapRowsToQuestions(rows, headers, file.name);

      console.log('Total valid questions:', questions.length);

      if (questions.length === 0) {
        setError("Die CSV-Datei enthält keine gültigen Fragen");
        showToast.error("Keine gültigen Fragen gefunden", {
          description: "Überprüfe das Format deiner CSV-Datei"
        });
        return null;
      }

      const visibility = shareWithOrganization ? 'organization' : 'private';
      try {
        const savedQuestions = await saveQuestions(questions, user?.id || '', visibility);
        
        // Invalidate questions query to refresh the list
        queryClient.invalidateQueries({ queryKey: ['questions'] });
        
        onQuestionsLoaded(savedQuestions);
        
        const sharingText = shareWithOrganization ? ' und mit deiner Organisation geteilt' : '';
        showToast.success(`${questions.length} Fragen aus "${file.name}" geladen${sharingText}`, {
          description: "Die Fragen wurden erfolgreich gespeichert"
        });
        
        return savedQuestions;
      } catch (error: any) {
        if (error.message?.includes('not whitelisted')) {
          setError("Deine Organisation ist nicht für das Teilen freigegeben");
          showToast.error("Organisation nicht freigegeben", {
            description: "Deine Organisation ist nicht für das Teilen von Fragen freigegeben."
          });
        }
        throw error;
      }
    }, {
      showErrorToast: true,
      errorMessage: "Fehler beim Verarbeiten der Datei"
    });
    
    // Reset the file input
    if (event.target) {
      event.target.value = '';
    }
  }, [user, onQuestionsLoaded, execute, queryClient, shareWithOrganization, isOrgWhitelisted]);

  return (
    <div className="flex flex-col items-center gap-4">
      <h2 className="text-2xl font-semibold text-slate-800 dark:text-zinc-50">
        Lade deine Fragen hoch
      </h2>
      <p className="text-slate-600 dark:text-zinc-300 mb-4">
        Bitte lade eine CSV-Datei mit den Spalten: Frage, A, B, C, D, E, Fach, Antwort, Kommentar, Schwierigkeit
      </p>
      
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex items-center space-x-2 mb-4">
        <Switch
          id="share-organization"
          checked={shareWithOrganization}
          onCheckedChange={setShareWithOrganization}
          disabled={!isOrgWhitelisted}
        />
        <div>
          <Label htmlFor="share-organization">
            Mit meiner Organisation teilen (@{user?.email?.split('@')[1]})
          </Label>
          {!isOrgWhitelisted && (
            <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
              Deine Organisation ist nicht für das Teilen freigegeben
            </p>
          )}
        </div>
      </div>

      <label htmlFor="csv-upload">
        <Button 
          variant="outline" 
          className="cursor-pointer hover:bg-slate-100 dark:hover:bg-zinc-800"
          onClick={() => document.getElementById('csv-upload')?.click()}
          disabled={isLoading}
        >
          {isLoading ? 'Wird hochgeladen...' : 'CSV-Datei auswählen'}
        </Button>
      </label>
      <input
        id="csv-upload"
        type="file"
        accept=".csv"
        onChange={handleFileUpload}
        className="hidden"
        disabled={isLoading}
      />
    </div>
  );
};

export default FileUpload;
