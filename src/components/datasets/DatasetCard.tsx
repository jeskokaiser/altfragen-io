import React from 'react';
import { Question } from '@/types/Question';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Brain, Edit2, Save, X } from 'lucide-react';
import DatasetStatistics from './DatasetStatistics';

interface DatasetCardProps {
  filename: string;
  questions: Question[];
  isSelected: boolean;
  onDatasetClick: (filename: string) => void;
  onStartTraining: (questions: Question[]) => void;
  isEditing: boolean;
  newFilename: string;
  onNewFilenameChange: (value: string) => void;
  onRename: (filename: string) => void;
  onSaveRename: (filename: string) => void;
  onCancelRename: () => void;
  onStartExam?: (questions: Question[]) => void;
}

const DatasetCard: React.FC<DatasetCardProps> = ({
  filename,
  questions,
  isSelected,
  onDatasetClick,
  onStartTraining,
  isEditing,
  newFilename,
  onNewFilenameChange,
  onRename,
  onSaveRename,
  onCancelRename,
  onStartExam,
}) => {
  return (
    <Card 
      className={`p-4 cursor-pointer transition-colors ${
        isSelected ? 'bg-slate-50' : 'hover:bg-slate-50'
      }`}
      onClick={() => onDatasetClick(filename)}
    >
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            {isEditing ? (
              <div className="flex gap-2">
                <Input
                  value={newFilename}
                  onChange={(e) => onNewFilenameChange(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  autoFocus
                />
                <Button
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSaveRename(filename);
                  }}
                >
                  <Save className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCancelRename();
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-medium">{filename}</h3>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRename(filename);
                  }}
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              onClick={(e) => {
                e.stopPropagation();
                onStartTraining(questions);
              }}
            >
              <Brain className="mr-2 h-4 w-4" />
              Training starten
            </Button>
            {onStartExam && (
              <Button
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  onStartExam(questions);
                }}
              >
                <Brain className="mr-2 h-4 w-4" />
                Prüfungssimulation
              </Button>
            )}
          </div>
        </div>
        <DatasetStatistics questions={questions} />
      </div>
    </Card>
  );
};

export default DatasetCard;