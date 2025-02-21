
import React from 'react';
import { CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, AlertCircle, Archive } from 'lucide-react';
import { Question } from '@/types/Question';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface DatasetHeaderProps {
  filename: string;
  questions: Question[];
  onStartTraining: (questions: Question[]) => void;
  createdAt: string;
  onArchive: (e: React.MouseEvent) => void;
}

const DatasetHeader: React.FC<DatasetHeaderProps> = ({
  filename,
  questions,
  onStartTraining,
  createdAt,
  onArchive,
}) => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  const unclearQuestions = questions.filter(q => q.is_unclear === true);
  const hasUnclearQuestions = unclearQuestions.length > 0;

  const handleUnclearClick = () => {
    navigate(`/unclear-questions/${encodeURIComponent(filename)}`);
  };

  const handleStartTraining = () => {
    localStorage.setItem('trainingQuestions', JSON.stringify(questions));
    onStartTraining(questions);
    navigate('/training');
  };

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-start">
      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <CardTitle className="text-lg font-medium text-slate-800 dark:text-white">
            {filename}
          </CardTitle>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                title="Archivieren"
              >
                <Archive className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Datensatz archivieren</AlertDialogTitle>
                <AlertDialogDescription>
                  Möchtest du den Datensatz "{filename}" wirklich archivieren? 
                  Der Datensatz wird aus der Hauptansicht entfernt, kann aber später wieder hergestellt werden.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                <AlertDialogAction onClick={onArchive}>
                  Archivieren
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>{questions.length} Fragen</span>
          <span>•</span>
          <span>Hochgeladen am {new Date(createdAt).toLocaleDateString()}</span>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
        {hasUnclearQuestions && (
          <Button 
            variant="outline"
            onClick={handleUnclearClick}
            className="w-full sm:w-auto"
            size={isMobile ? "sm" : "default"}
          >
            <AlertCircle className="mr-2 h-4 w-4" />
            Unklare Fragen ({unclearQuestions.length})
          </Button>
        )}
        <Button 
          onClick={handleStartTraining}
          className="w-full sm:w-auto"
          size={isMobile ? "sm" : "default"}
        >
          <Play className="mr-2 h-4 w-4" />
          Training starten
        </Button>
      </div>
    </div>
  );
};

export default DatasetHeader;
