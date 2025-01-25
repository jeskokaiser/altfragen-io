import React from 'react';
import { CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play } from 'lucide-react';
import { Question } from '@/types/Question';

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
  return (
    <div className="flex justify-between items-start gap-4">
      <div className="flex-1 space-y-2">
        <CardTitle className="text-lg font-medium text-slate-800">
          {filename}
        </CardTitle>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>{questions.length} Fragen</span>
          <span>•</span>
          <span>Hochgeladen am {new Date(createdAt).toLocaleDateString()}</span>
        </div>
      </div>
      <Button 
        onClick={() => onStartTraining(questions)}
        className="shrink-0"
      >
        <Play className="mr-2 h-4 w-4" />
        Training starten
      </Button>
    </div>
  );
};

export default DatasetHeader;