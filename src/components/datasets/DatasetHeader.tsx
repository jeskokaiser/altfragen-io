
import React from 'react';
import { CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, AlertCircle } from 'lucide-react';
import { Question } from '@/types/Question';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';

interface DatasetHeaderProps {
  filename: string;
  questions: Question[];
  onStartTraining: (questions: Question[]) => void;
  createdAt: string;
}

const DatasetHeader: React.FC<DatasetHeaderProps> = ({
  filename,
  questions,
  onStartTraining,
  createdAt,
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
        <CardTitle className="text-lg font-medium text-slate-800 dark:text-white">
          {filename}
        </CardTitle>
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
