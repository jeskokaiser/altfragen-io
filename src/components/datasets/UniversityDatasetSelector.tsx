import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Question } from '@/types/Question';
import { Search, CheckSquare, X, BookOpen, Users } from 'lucide-react';
import { Badge } from "@/components/ui/badge";

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
    )
    .sort(([a], [b]) => a.localeCompare(b)); // Sort alphabetically by filename

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

  const handleCancel = () => {
    setLocalSelectedDatasets(selectedDatasets);
    onOpenChange(false);
  };

  const totalDatasets = Object.keys(groupedQuestions).length;
  const selectedCount = localSelectedDatasets.length;
  const hasChanges = JSON.stringify(localSelectedDatasets.sort()) !== JSON.stringify(selectedDatasets.sort());

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader className="space-y-3">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <BookOpen className="h-5 w-5" />
            Universitäts-Datensätze verwalten
          </DialogTitle>
          <div className="text-sm text-muted-foreground">
            Wähle aus, welche Datensätze dauerhaft im Dashboard angezeigt werden sollen.
            {selectedDatasets.length === 0 ? ' Standardmäßig werden alle Datensätze angezeigt.' : ''}
          </div>
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
        
        <div className="flex items-center justify-between mb-4 p-3 bg-muted/30 rounded-lg">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {selectedCount} von {totalDatasets}
            </Badge>
            <span className="text-sm text-muted-foreground">ausgewählt</span>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleSelectAll}
              className="text-xs h-8 px-3"
            >
              <CheckSquare className="h-3 w-3 mr-1" />
              Alle
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleClearAll}
              className="text-xs h-8 px-3"
            >
              <X className="h-3 w-3 mr-1" />
              Keine
            </Button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto pr-2 -mr-2 mb-4">
          <div className="space-y-3">
            {filteredDatasets.length > 0 ? (
              filteredDatasets.map(([filename, questions]) => {
                const isSelected = localSelectedDatasets.includes(filename);
                const wasOriginallySelected = selectedDatasets.includes(filename);
                const hasChanged = isSelected !== wasOriginallySelected;
                
                return (
                  <div 
                    key={filename} 
                    className={`flex items-center justify-between p-4 rounded-lg border transition-all cursor-pointer ${
                      isSelected 
                        ? 'bg-primary/5 border-primary/20 shadow-sm' 
                        : 'hover:bg-muted/50 border-border'
                    } ${hasChanged ? 'ring-2 ring-primary/30' : ''}`}
                    onClick={() => handleToggleDataset(filename)}
                  >
                    <div className="flex items-center space-x-3 flex-1">
                      <Checkbox 
                        id={`select-${filename}`}
                        checked={isSelected}
                        onCheckedChange={() => handleToggleDataset(filename)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className="flex-1">
                        <label htmlFor={`select-${filename}`} className="cursor-pointer font-medium text-sm">
                          {filename}
                        </label>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-muted-foreground">
                            {questions.length} Fragen
                          </span>
                          {hasChanged && (
                            <Badge variant="outline" className="text-xs px-1.5 py-0">
                              {isSelected ? 'Hinzugefügt' : 'Entfernt'}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-lg font-medium mb-1">Keine Datensätze gefunden</p>
                <p className="text-sm">Versuche einen anderen Suchbegriff</p>
              </div>
            )}
          </div>
        </div>
        
        <DialogFooter className="flex justify-between sm:justify-between border-t pt-4">
          <Button variant="outline" onClick={handleCancel}>
            Abbrechen
          </Button>
          <Button 
            onClick={handleSave}
            disabled={!hasChanges}
            className={hasChanges ? 'bg-primary' : ''}
          >
            {hasChanges ? 'Änderungen speichern' : 'Keine Änderungen'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UniversityDatasetSelector;
