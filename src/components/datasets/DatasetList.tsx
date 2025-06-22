
import React from 'react';
import DatasetCard from './DatasetCard';

interface QuestionSummary {
  id: string;
  filename: string;
  subject: string;
  difficulty: number;
  visibility: 'private' | 'university' | 'public';
  user_id: string | null;
  university_id: string | null;
  semester: string | null;
  year: string | null;
  exam_name: string | null;
  created_at: string;
}

interface DatasetListProps {
  groupedQuestions: Record<string, QuestionSummary[]>;
  selectedFilename: string | null;
  onDatasetClick: (filename: string) => void;
  onStartTraining: (questions: QuestionSummary[]) => void;
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
