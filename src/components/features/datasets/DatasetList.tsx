
import React from 'react';
import { Question } from '@/types/models/Question';
import DatasetCard from './DatasetCard';
import { useAuth } from '@/contexts/AuthContext';

interface DatasetListProps {
  groupedQuestions: Record<string, Question[]>;
  selectedFilename: string | null;
  onDatasetClick: (filename: string) => void;
  onStartTraining: (questions: Question[]) => void;
  isArchived?: boolean;
  onToggleVisibility?: (filename: string, currentVisibility: 'private' | 'organization') => void;
  isDatasetShared?: (questions: Question[]) => boolean;
}

const DatasetList = ({
  groupedQuestions,
  selectedFilename,
  onDatasetClick,
  onStartTraining,
  isArchived = false,
  onToggleVisibility,
  isDatasetShared
}: DatasetListProps) => {
  const { user } = useAuth();

  return (
    <div className="grid gap-4">
      {Object.entries(groupedQuestions).map(([filename, questions]) => {
        const isCreator = questions.length > 0 && questions[0].user_id === user?.id;
        const isShared = isDatasetShared ? isDatasetShared(questions) : false;
        
        return (
          <DatasetCard
            key={filename}
            filename={filename}
            questions={questions}
            isSelected={selectedFilename === filename}
            onDatasetClick={onDatasetClick}
            onStartTraining={onStartTraining}
            isArchived={isArchived}
            isCreator={isCreator}
            isShared={isShared}
            onToggleVisibility={onToggleVisibility}
          />
        );
      })}
    </div>
  );
};

export default DatasetList;
