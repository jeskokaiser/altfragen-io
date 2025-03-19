
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Question } from '@/types/Question';
import { Search, CheckSquare, X } from 'lucide-react';

interface UniversityDatasetSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupedQuestions: Record<string, Question[]>;
  selectedDatasets: string[];
  onSelectedDatasetsChange: (datasets: string[]) => void;
}

const UniversityDatasetSelector: React.FC<UniversityDatasetSelectorProps> = ({
  open,
  onOpenChange,
  groupedQuestions,
  selectedDatasets,
  onSelectedDatasetsChange,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [localSelectedDatasets, setLocalSelectedDatasets] = useState<string[]>([]);

  // Initialize local state when modal opens
  useEffect(() => {
    if (open) {
      setLocalSelectedDatasets(selectedDatasets);
    }
  }, [open, selectedDatasets]);

  const filteredDatasets = Object.entries(groupedQuestions)
    .filter(([filename]) => 
      filename.toLowerCase().includes(searchTerm.toLowerCase())
    );

  const handleToggleDataset = (filename: string) => {
    setLocalSelectedDatasets(prev => 
      prev.includes(filename) 
        ? prev.filter(f => f !== filename) 
        : [...prev, filename]
    );
  };

  const handleSelectAll = () => {
    setLocalSelectedDatasets(Object.keys(groupedQuestions));
  };

  const handleClearAll = () => {
    setLocalSelectedDatasets([]);
  };

  const handleSave = () => {
    onSelectedDatasetsChange(localSelectedDatasets);
    onOpenChange(false);
  };

  const totalDatasets = Object.keys(groupedQuestions).length;
  const selectedCount = localSelectedDatasets.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Datensätze auswählen</DialogTitle>
        </DialogHeader>
        
        <div className="relative mb-4">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Nach Datensätzen suchen..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">
            {selectedCount} von {totalDatasets} Datensätzen ausgewählt
          </span>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleSelectAll}
              className="text-xs h-7 px-2"
            >
              Alle
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleClearAll}
              className="text-xs h-7 px-2"
            >
              Keine
            </Button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto pr-2 -mr-2 mb-4">
          <div className="space-y-2">
            {filteredDatasets.length > 0 ? (
              filteredDatasets.map(([filename, questions]) => (
                <div 
                  key={filename} 
                  className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 cursor-pointer"
                  onClick={() => handleToggleDataset(filename)}
                >
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id={`select-${filename}`}
                      checked={localSelectedDatasets.includes(filename)}
                      onCheckedChange={() => handleToggleDataset(filename)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <label htmlFor={`select-${filename}`} className="cursor-pointer text-sm">
                      {filename}
                    </label>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {questions.length} Fragen
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                Keine Datensätze gefunden
              </div>
            )}
          </div>
        </div>
        
        <DialogFooter className="flex justify-between sm:justify-between">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button onClick={handleSave}>
            Speichern
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UniversityDatasetSelector;
