
import React from 'react';
import { Question } from '@/types/Question';
import DatasetCard from './DatasetCard';

interface DatasetListProps {
  groupedQuestions: Record<string, Question[]>;
  selectedFilename: string | null;
  onDatasetClick: (filename: string) => void;
  onStartTraining: (questions: Question[]) => void;
  isArchived?: boolean;
  groupBy?: 'filename' | 'examName';
}

const DatasetList = ({
  groupedQuestions,
  selectedFilename,
  onDatasetClick,
  onStartTraining,
  isArchived = false,
  groupBy = 'examName',
}: DatasetListProps) => {
  return (
    <div className="grid gap-4">
      {Object.entries(groupedQuestions).map(([key, questions]) => (
        <DatasetCard
          key={key}
          filename={key}
          questions={questions}
          isSelected={selectedFilename === key}
          onDatasetClick={onDatasetClick}
          onStartTraining={onStartTraining}
          isArchived={isArchived}
          displayName={groupBy === 'examName' ? key : questions[0]?.exam_name || key}
        />
      ))}
    </div>
  );
};

export default DatasetList;
