import React from 'react';
import { Question } from '@/types/Question';
import DatasetCard from './DatasetCard';

interface DatasetListProps {
  groupedQuestions: Record<string, Question[]>;
  selectedFilename: string | null;
  onDatasetClick: (filename: string) => void;
  onStartTraining: (questions: Question[]) => void;
}

const DatasetList = ({
  groupedQuestions,
  selectedFilename,
  onDatasetClick,
  onStartTraining,
}: DatasetListProps) => {
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
        />
      ))}
    </div>
  );
};

export default DatasetList;