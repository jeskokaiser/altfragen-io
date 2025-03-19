
import React from 'react';
import { Question } from '@/types/Question';
import DatasetCard from './DatasetCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Folders } from 'lucide-react';

interface DatasetListProps {
  groupedQuestions: Record<string, Question[]>;
  selectedFilename: string | null;
  onDatasetClick: (filename: string) => void;
  onStartTraining: (questions: Question[]) => void;
  isArchived?: boolean;
  isCompactView?: boolean;
}

const DatasetList = ({
  groupedQuestions,
  selectedFilename,
  onDatasetClick,
  onStartTraining,
  isArchived = false,
  isCompactView = false,
}: DatasetListProps) => {
  if (isCompactView) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {Object.entries(groupedQuestions).map(([filename, questions]) => (
          <Card 
            key={filename} 
            className={`border hover:shadow-md transition-all duration-200 cursor-pointer ${selectedFilename === filename ? 'ring-2 ring-primary' : ''}`}
            onClick={() => onDatasetClick(filename)}
          >
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-2">
                <Folders className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">{filename}</p>
                  <p className="text-xs text-muted-foreground">{questions.length} Fragen</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onStartTraining(questions);
                }}
              >
                Lernen
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {Object.entries(groupedQuestions).map(([filename, questions]) => (
        <DatasetCard
          key={filename}
          filename={filename}
          questions={questions}
          isSelected={selectedFilename === filename}
          onDatasetClick={onDatasetClick}
          onStartTraining={onStartTraining}
          isArchived={isArchived}
        />
      ))}
    </div>
  );
};

export default DatasetList;
