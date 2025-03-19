
import React from 'react';
import { Question } from '@/types/Question';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

interface SelectedDatasetsDisplayProps {
  groupedQuestions: Record<string, Question[]>;
  selectedDatasets: string[];
  onRemoveDataset: (filename: string) => void;
  onClearAll: () => void;
}

const SelectedDatasetsDisplay: React.FC<SelectedDatasetsDisplayProps> = ({
  groupedQuestions,
  selectedDatasets,
  onRemoveDataset,
  onClearAll
}) => {
  if (selectedDatasets.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <p className="text-lg text-slate-600 dark:text-zinc-300 mb-2">
            Keine Datensätze ausgewählt
          </p>
          <p className="text-sm text-muted-foreground">
            Wähle Datensätze aus, um sie hier anzuzeigen
          </p>
        </CardContent>
      </Card>
    );
  }

  const totalQuestions = selectedDatasets.reduce((sum, filename) => {
    return sum + (groupedQuestions[filename]?.length || 0);
  }, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">
            {selectedDatasets.length} Datensätze ausgewählt
          </span>
          <Badge variant="secondary">
            {totalQuestions} Fragen
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearAll}
          className="h-8 px-2 text-xs"
        >
          Alle entfernen
        </Button>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {selectedDatasets.map(filename => (
          <Badge 
            key={filename} 
            variant="outline"
            className="flex items-center gap-1 py-1.5 px-3"
          >
            <span className="max-w-[200px] truncate">{filename}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRemoveDataset(filename)}
              className="h-4 w-4 p-0 ml-1"
            >
              <X className="h-3 w-3" />
              <span className="sr-only">Remove</span>
            </Button>
          </Badge>
        ))}
      </div>
    </div>
  );
};

export default SelectedDatasetsDisplay;
