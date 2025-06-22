
import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, BookOpen, Calendar, Users } from 'lucide-react';

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

interface UniversityDatasetSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupedQuestions: Record<string, QuestionSummary[]>;
  selectedDatasets: string[];
  onSelectedDatasetsChange: (datasets: string[]) => void;
}

const UniversityDatasetSelector = ({
  open,
  onOpenChange,
  groupedQuestions,
  selectedDatasets,
  onSelectedDatasetsChange
}: UniversityDatasetSelectorProps) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredDatasets = useMemo(() => {
    if (!searchTerm) return Object.entries(groupedQuestions);
    
    return Object.entries(groupedQuestions).filter(([filename, questions]) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        filename.toLowerCase().includes(searchLower) ||
        questions.some(q => 
          q.subject.toLowerCase().includes(searchLower) ||
          q.semester?.toLowerCase().includes(searchLower) ||
          q.year?.toLowerCase().includes(searchLower)
        )
      );
    });
  }, [groupedQuestions, searchTerm]);

  const handleDatasetToggle = (filename: string, checked: boolean) => {
    if (checked) {
      onSelectedDatasetsChange([...selectedDatasets, filename]);
    } else {
      onSelectedDatasetsChange(selectedDatasets.filter(f => f !== filename));
    }
  };

  const handleSelectAll = () => {
    const allFilenames = filteredDatasets.map(([filename]) => filename);
    const allSelected = allFilenames.every(filename => selectedDatasets.includes(filename));
    
    if (allSelected) {
      // Deselect all filtered datasets
      onSelectedDatasetsChange(
        selectedDatasets.filter(filename => !allFilenames.includes(filename))
      );
    } else {
      // Select all filtered datasets
      const newSelection = [...new Set([...selectedDatasets, ...allFilenames])];
      onSelectedDatasetsChange(newSelection);
    }
  };

  const allFilteredSelected = filteredDatasets.length > 0 && 
    filteredDatasets.every(([filename]) => selectedDatasets.includes(filename));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Universitäts-Datensätze auswählen
          </DialogTitle>
          <DialogDescription>
            Wähle die Datensätze aus, die dauerhaft in deinem Dashboard angezeigt werden sollen.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Nach Datensätzen, Fächern oder Semestern suchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant="outline"
              onClick={handleSelectAll}
              className="whitespace-nowrap"
            >
              {allFilteredSelected ? 'Alle abwählen' : 'Alle auswählen'}
            </Button>
          </div>

          <div className="text-sm text-muted-foreground">
            {selectedDatasets.length} von {Object.keys(groupedQuestions).length} Datensätzen ausgewählt
          </div>

          <ScrollArea className="h-96">
            <div className="space-y-3">
              {filteredDatasets.map(([filename, questions]) => {
                const isSelected = selectedDatasets.includes(filename);
                const questionCount = questions.length;
                const subjects = [...new Set(questions.map(q => q.subject))];
                const semesters = [...new Set(questions.map(q => q.semester).filter(Boolean))];
                const years = [...new Set(questions.map(q => q.year).filter(Boolean))];

                return (
                  <div
                    key={filename}
                    className={`p-4 rounded-lg border transition-colors ${
                      isSelected 
                        ? 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800' 
                        : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) => handleDatasetToggle(filename, checked as boolean)}
                        className="mt-1"
                      />
                      
                      <div className="flex-1 space-y-2">
                        <div className="flex items-start justify-between">
                          <h3 className="font-medium text-sm">{filename}</h3>
                          <Badge variant="outline" className="text-xs">
                            {questionCount} Fragen
                          </Badge>
                        </div>
                        
                        <div className="space-y-1">
                          {subjects.length > 0 && (
                            <div className="flex items-center gap-1 flex-wrap">
                              <BookOpen className="h-3 w-3 text-muted-foreground" />
                              {subjects.slice(0, 3).map(subject => (
                                <Badge key={subject} variant="secondary" className="text-xs">
                                  {subject}
                                </Badge>
                              ))}
                              {subjects.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{subjects.length - 3}
                                </Badge>
                              )}
                            </div>
                          )}
                          
                          {(semesters.length > 0 || years.length > 0) && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              <span>
                                {semesters.join(', ')} {years.join(', ')}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {filteredDatasets.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  {searchTerm ? 'Keine Datensätze gefunden' : 'Keine Datensätze verfügbar'}
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Abbrechen
            </Button>
            <Button onClick={() => onOpenChange(false)}>
              Fertig ({selectedDatasets.length} ausgewählt)
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UniversityDatasetSelector;
