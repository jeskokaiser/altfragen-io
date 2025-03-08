
import React, { memo, useCallback } from 'react';
import { Question } from '@/types/models/Question';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, Share2, Lock } from 'lucide-react';
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import DatasetStatistics from '@/components/datasets/DatasetStatistics';
import DatasetHeader from './DatasetHeader';
import QuestionList from '@/components/datasets/QuestionList';
import { useUserPreferences } from '@/contexts/UserPreferencesContext';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';

interface DatasetCardProps {
  filename: string;
  questions: Question[];
  isSelected: boolean;
  onDatasetClick: (filename: string) => void;
  onStartTraining: (questions: Question[]) => void;
  isArchived?: boolean;
  isCreator?: boolean;
  isShared?: boolean;
  onToggleVisibility?: (filename: string, currentVisibility: 'private' | 'organization') => void;
}

const DatasetCard: React.FC<DatasetCardProps> = memo(({
  filename,
  questions,
  isSelected,
  onDatasetClick,
  onStartTraining,
  isArchived = false,
  isCreator = true,
  isShared = false,
  onToggleVisibility
}) => {
  const { archiveDataset, restoreDataset } = useUserPreferences();
  const { user } = useAuth();

  // Memoize handlers to prevent unnecessary re-renders
  const handleArchive = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    archiveDataset(filename);
  }, [archiveDataset, filename]);

  const handleRestore = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    restoreDataset(filename);
  }, [restoreDataset, filename]);

  const handleDatasetClick = useCallback(() => {
    onDatasetClick(filename);
  }, [onDatasetClick, filename]);

  const handleToggleVisibility = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (isCreator && onToggleVisibility) {
      onToggleVisibility(filename, isShared ? 'organization' : 'private');
    }
  }, [isCreator, onToggleVisibility, filename, isShared]);

  // Determine if user is the creator of this dataset
  const isUserCreator = questions.length > 0 && questions[0].user_id === user?.id;

  return (
    <Card className={`w-full transition-all duration-200 ${isSelected ? 'ring-2 ring-primary' : 'hover:shadow-md'}`}>
      <CardHeader className="bg-slate-50/50 dark:bg-black/40">
        <div className="flex justify-between items-start gap-2">
          <DatasetHeader
            filename={filename}
            questions={questions}
            onStartTraining={onStartTraining}
            createdAt={questions[0].created_at!}
            onArchive={handleArchive}
            onRestore={handleRestore}
            isArchived={isArchived}
            isCreator={isCreator}
          />
          
          <div className="flex items-center gap-2">
            {isShared && (
              <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200 flex items-center gap-1 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700">
                <Share2 className="h-3 w-3" />
                Geteilt
              </Badge>
            )}
            
            {!isShared && isCreator && (
              <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200 flex items-center gap-1 dark:bg-slate-900/30 dark:text-slate-300 dark:border-slate-700">
                <Lock className="h-3 w-3" />
                Privat
              </Badge>
            )}
            
            {isCreator && onToggleVisibility && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleToggleVisibility}
                className="ml-2"
              >
                {isShared ? 'Privat machen' : 'Teilen'}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        <DatasetStatistics questions={questions} />
      </CardContent>

      <Separator />

      <CardFooter className="p-4">
        <Button
          variant="outline"
          onClick={handleDatasetClick}
          className="w-full"
        >
          {isSelected ? (
            <>
              <ChevronUp className="mr-2 h-4 w-4" />
              Fragen ausblenden
            </>
          ) : (
            <>
              <ChevronDown className="mr-2 h-4 w-4" />
              Fragen anzeigen
            </>
          )}
        </Button>
      </CardFooter>

      {isSelected && <QuestionList questions={questions} isSelected={isSelected} />}
    </Card>
  );
});

DatasetCard.displayName = 'DatasetCard';

export default DatasetCard;
