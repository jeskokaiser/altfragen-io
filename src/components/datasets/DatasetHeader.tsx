import React from 'react';
import { CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, AlertCircle, Archive, RotateCcw, Lock, GraduationCap, Share2, EyeOff } from 'lucide-react';
import { Question } from '@/types/Question';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { updateDatasetVisibility } from '@/services/DatabaseService';

interface DatasetHeaderProps {
  filename: string;
  questions: Question[];
  onStartTraining: (questions: Question[]) => void;
  createdAt: string;
  onArchive?: (e: React.MouseEvent) => void;
  onRestore?: (e: React.MouseEvent) => void;
  isArchived?: boolean;
  displayName?: string;
  onUnclearQuestions: () => void;
}

const DatasetHeader: React.FC<DatasetHeaderProps> = ({
  filename,
  questions,
  onStartTraining,
  createdAt,
  onArchive,
  onRestore,
  isArchived = false,
  displayName,
  onUnclearQuestions,
}) => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { user, universityId } = useAuth();
  
  // Query ignored questions count for this dataset
  const { data: ignoredQuestionsCount = 0 } = useQuery({
    queryKey: ['ignored-questions-count', filename, user?.id],
    queryFn: async () => {
      if (!user) return 0;
      
      const { data, error } = await supabase
        .from('user_unclear_questions')
        .select(`
          id,
          questions:question_id (
            filename,
            exam_name
          )
        `)
        .eq('user_id', user.id);
      
      if (error) {
        console.error('Error fetching ignored questions count:', error);
        return 0;
      }
      
      // Count questions that match this dataset's filename OR exam_name
      const count = data?.filter(item => 
        item.questions && (
          item.questions.filename === filename || 
          item.questions.exam_name === filename
        )
      ).length || 0;
      
      return count;
    },
    enabled: !!user
  });

  // Determine visibility of the dataset (using the first question as reference)
  const datasetVisibility = questions[0]?.visibility || 'private';
  
  // Determine if this is a private dataset (owned by current user)
  const isPrivateDataset = datasetVisibility === 'private' && user?.id === questions[0]?.user_id;

  // Check if dataset can be changed to private (only if all questions are private)
  const canChangeToPrivate = !questions.some(q => q.visibility === 'university');

  const handleUnclearClick = () => {
    onUnclearQuestions();
  };

  const handleStartTraining = () => {
    onStartTraining(questions);
  };

  const handleChangeVisibility = async (newVisibility: 'private' | 'university') => {
    try {
      // If trying to change from university to private, we need to check if this is allowed
      if (datasetVisibility === 'university' && newVisibility === 'private') {
        toast.error('Änderung nicht möglich', {
          description: 'Fragen, die mit deiner Universität geteilt wurden, können nicht zurück auf privat gesetzt werden.'
        });
        return;
      }

      await updateDatasetVisibility(filename, user?.id || '', newVisibility, universityId);

      // Show success message
      const visibilityText = newVisibility === 'private' 
        ? 'privat' 
        : 'mit deiner Universität geteilt';
          
      toast.success(`Sichtbarkeit geändert`, {
        description: `Die Fragen sind jetzt ${visibilityText}`
      });

      // Refresh the page to reflect the changes
      window.location.reload();
    } catch (error: any) {
      console.error('Error changing visibility:', error);
      toast.error('Fehler beim Ändern der Sichtbarkeit', {
        description: error.message
      });
    }
  };

  const getVisibilityIcon = () => {
    switch (datasetVisibility) {
      case 'university':
        return <GraduationCap className="h-4 w-4 text-blue-500" />;
      default:
        return <Lock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getVisibilityText = () => {
    switch (datasetVisibility) {
      case 'university':
        return "Universitätsweit (für alle an deiner Uni)";
      default:
        return "Privat (nur für dich)";
    }
  };

  // Only show visibility controls if the user is the owner of the questions
  const canChangeVisibility = user && user.id === questions[0]?.user_id;

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-start">
      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <CardTitle className="text-lg font-medium text-slate-800 dark:text-white">
            {displayName || filename}
          </CardTitle>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div>{getVisibilityIcon()}</div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{getVisibilityText()}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          {/* Only show archive/restore button for private datasets */}
          {isPrivateDataset && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  title={isArchived ? "Wiederherstellen" : "Archivieren"}
                >
                  {isArchived ? (
                    <RotateCcw className="h-4 w-4" />
                  ) : (
                    <Archive className="h-4 w-4" />
                  )}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    {isArchived ? "Datensatz wiederherstellen" : "Datensatz archivieren"}
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    {isArchived 
                      ? `Möchtest du den Datensatz "${filename}" wiederherstellen? Der Datensatz wird wieder in der Hauptansicht angezeigt.`
                      : `Möchtest du den Datensatz "${filename}" wirklich archivieren? Der Datensatz wird aus der Hauptansicht entfernt, kann aber später wieder hergestellt werden.`
                    }
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                  <AlertDialogAction onClick={isArchived ? onRestore : onArchive}>
                    {isArchived ? "Wiederherstellen" : "Archivieren"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>{questions.length} Fragen</span>
          <span>•</span>
          <span>Hochgeladen am {new Date(createdAt).toLocaleDateString()}</span>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
        {canChangeVisibility && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="outline" 
                className="w-full sm:w-auto"
                size={isMobile ? "sm" : "default"}
              >
                <Share2 className="mr-2 h-4 w-4" />
                Teilen
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {datasetVisibility === 'private' ? 'Mit Universität teilen' : 'Sichtbarkeit ändern'}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {datasetVisibility === 'private' ? (
                    <>
                      <p className="mb-2">Möchtest du diesen Datensatz mit deiner Universität teilen?</p>
                      <p className="font-bold text-yellow-600 dark:text-yellow-500">Achtung: Diese Aktion kann nicht rückgängig gemacht werden.</p>
                    </>
                  ) : (
                    <p>Die Sichtbarkeit dieses Datensatzes ist bereits auf "Universität" gesetzt und kann nicht mehr geändert werden.</p>
                  )}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                {datasetVisibility === 'private' && (
                  <AlertDialogAction onClick={() => handleChangeVisibility('university')}>
                    Mit Universität teilen
                  </AlertDialogAction>
                )}
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
        
        {/* Always show ignored questions button */}
        <Button 
          variant="outline"
          onClick={handleUnclearClick}
          className="w-full sm:w-auto"
          size={isMobile ? "sm" : "default"}
        >
          <EyeOff className="mr-2 h-4 w-4" />
          Ignorierte Fragen
          {ignoredQuestionsCount > 0 && (
            <span className="ml-1 px-1.5 py-0.5 text-xs bg-muted rounded-full">
              {ignoredQuestionsCount}
            </span>
          )}
        </Button>
        
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
