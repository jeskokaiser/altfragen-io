
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X, Trash2 } from 'lucide-react';

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

interface SelectedDatasetsDisplayProps {
  groupedQuestions: Record<string, QuestionSummary[]>;
  selectedDatasets: string[];
  onRemoveDataset: (filename: string) => void;
  onClearAll: () => void;
}

const SelectedDatasetsDisplay = ({
  groupedQuestions,
  selectedDatasets,
  onRemoveDataset,
  onClearAll
}: SelectedDatasetsDisplayProps) => {
  if (selectedDatasets.length === 0) return null;

  return (
    <div className="bg-blue-50/50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100">
          Ausgewählte Datensätze ({selectedDatasets.length})
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearAll}
          className="text-blue-700 hover:text-blue-900 dark:text-blue-300 dark:hover:text-blue-100 h-6 px-2"
        >
          <Trash2 className="h-3 w-3 mr-1" />
          Alle entfernen
        </Button>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {selectedDatasets.map(filename => {
          const questions = groupedQuestions[filename] || [];
          const questionCount = questions.length;
          
          return (
            <Badge
              key={filename}
              variant="secondary"
              className="flex items-center gap-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 border-blue-300 dark:border-blue-700"
            >
              <span className="max-w-40 truncate">{filename}</span>
              <span className="text-xs opacity-70">({questionCount})</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRemoveDataset(filename)}
                className="h-4 w-4 p-0 ml-1 hover:bg-blue-200 dark:hover:bg-blue-800"
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          );
        })}
      </div>
    </div>
  );
};

export default SelectedDatasetsDisplay;
