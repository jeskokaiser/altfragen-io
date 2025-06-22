
import React, { memo } from 'react';
import { Question } from '@/types/Question';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import DatasetStatistics from './DatasetStatistics';
import DatasetHeader from './DatasetHeader';
import QuestionList from './QuestionList';
import { useUserPreferences } from '@/contexts/UserPreferencesContext';

interface DatasetCardProps {
  filename: string;
  questions: Question[];
  isSelected: boolean;
  onDatasetClick: (filename: string) => void;
  onStartTraining: (questions: Question[]) => void;
  isArchived?: boolean;
  displayName?: string;
}

const DatasetCard: React.FC<DatasetCardProps> = memo(({
  filename,
  questions,
  isSelected,
  onDatasetClick,
  onStartTraining,
  isArchived = false,
  displayName,
}) => {
  const { archiveDataset, restoreDataset } = useUserPreferences();
  const navigate = useNavigate();

  const handleArchive = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await archiveDataset(filename);
  };

  const handleRestore = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await restoreDataset(filename);
  };

  const handleUnclearQuestions = () => {
    navigate(`/unclear-questions/${encodeURIComponent(filename)}`);
  };

  const displayTitle = displayName || filename;

  return (
    <Card className={`w-full transition-all duration-200 ${isSelected ? 'ring-2 ring-primary' : 'hover:shadow-md'}`}>
      <CardHeader className="bg-slate-50/50 dark:bg-black/40">
        <DatasetHeader
          filename={filename}
          questions={questions}
          onStartTraining={onStartTraining}
          createdAt={questions[0].created_at!}
          onArchive={handleArchive}
          onRestore={handleRestore}
          isArchived={isArchived}
          displayName={displayTitle}
          onUnclearQuestions={handleUnclearQuestions}
        />
      </CardHeader>

      <CardContent className="pt-6">
        <DatasetStatistics questions={questions} />
      </CardContent>

      <Separator />

      <CardFooter className="p-4">
        <Button
          variant="outline"
          onClick={() => onDatasetClick(filename)}
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

      <QuestionList questions={questions} isSelected={isSelected} />
    </Card>
  );
});

DatasetCard.displayName = 'DatasetCard';

export default DatasetCard;
