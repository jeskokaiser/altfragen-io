import React from 'react';
import { Question } from '@/types/Question';
import DatasetCard from './DatasetCard';

interface DatasetListProps {
  groupedQuestions: Record<string, Question[]>;
  selectedFilename: string | null;
  onDatasetClick: (filename: string) => void;
  onStartTraining: (questions: Question[]) => void;
  editingFilename: string | null;
  newFilename: string;
  onNewFilenameChange: (value: string) => void;
  onRename: (filename: string) => void;
  onSaveRename: (oldFilename: string, newFilename: string) => void;
  onCancelRename: () => void;
}

const DatasetList: React.FC<DatasetListProps> = ({
  groupedQuestions,
  selectedFilename,
  onDatasetClick,
  onStartTraining,
  editingFilename,
  newFilename,
  onNewFilenameChange,
  onRename,
  onSaveRename,
  onCancelRename,
}) => {
  return (
    <div className="space-y-6">
      {Object.entries(groupedQuestions).map(([filename, questions]) => (
        <DatasetCard
          key={filename}
          filename={filename}
          questions={questions}
          isSelected={selectedFilename === filename}
          onDatasetClick={onDatasetClick}
          onStartTraining={onStartTraining}
          isEditing={editingFilename === filename}
          newFilename={newFilename}
          onNewFilenameChange={onNewFilenameChange}
          onRename={onRename}
          onSaveRename={onSaveRename}
          onCancelRename={onCancelRename}
        />
      ))}
    </div>
  );
};

export default DatasetList;