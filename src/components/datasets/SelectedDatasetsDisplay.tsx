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
    return <Card>
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <p className="text-lg text-slate-600 dark:text-zinc-300 mb-2">
            Keine Datensätze ausgewählt
          </p>
          <p className="text-sm text-muted-foreground">
            Wähle Datensätze aus, um sie hier anzuzeigen
          </p>
        </CardContent>
      </Card>;
  }
  const totalQuestions = selectedDatasets.reduce((sum, filename) => {
    return sum + (groupedQuestions[filename]?.length || 0);
  }, 0);
  return <div className="space-y-4">
      <div className="flex items-center justify-between">
        
        <Button variant="ghost" size="sm" onClick={onClearAll} className="h-8 px-2 text-xs">
          Alle entfernen
        </Button>
      </div>
      
      
    </div>;
};
export default SelectedDatasetsDisplay;