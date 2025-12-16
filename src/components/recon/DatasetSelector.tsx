import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, Plus } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getUniversityDatasets, type Dataset } from '@/services/DatasetService';

interface DatasetSelectorProps {
  universityId: string;
  selectedDataset: Dataset | null;
  onSelectDataset: (dataset: Dataset) => void;
  disabled?: boolean;
}

const DatasetSelector: React.FC<DatasetSelectorProps> = ({
  universityId,
  selectedDataset,
  onSelectDataset,
  disabled = false,
}) => {
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newDatasetName, setNewDatasetName] = useState('');

  const { data: datasets, isLoading, error } = useQuery({
    queryKey: ['university-datasets', universityId],
    queryFn: () => getUniversityDatasets(universityId),
    enabled: !!universityId,
  });

  const handleValueChange = (value: string) => {
    if (value === '__create_new__') {
      setIsCreateDialogOpen(true);
      return;
    }
    const dataset = datasets?.find((d) => d.exam_name === value);
    if (dataset) {
      onSelectDataset(dataset);
    }
  };

  const handleCreateDataset = () => {
    if (!newDatasetName.trim()) return;

    const newDataset: Dataset = {
      exam_name: newDatasetName.trim(),
      question_count: 0,
      user_ids: [],
    };

    onSelectDataset(newDataset);
    setIsCreateDialogOpen(false);
    setNewDatasetName('');
    // Invalidate to refresh the list (the new dataset will appear once questions are added)
    queryClient.invalidateQueries({ queryKey: ['university-datasets', universityId] });
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Fehler beim Laden</AlertTitle>
        <AlertDescription>
          Die Datasets konnten nicht geladen werden. Bitte versuche es später erneut.
        </AlertDescription>
      </Alert>
    );
  }

  if (!datasets || datasets.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Keine Datasets verfügbar</AlertTitle>
        <AlertDescription>
          Es gibt noch keine Datasets für deine Universität. Lade zuerst Fragen hoch, um Datasets zu erstellen.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="dataset-select">Datensatz auswählen *</Label>
        <Select
          value={selectedDataset?.exam_name || ''}
          onValueChange={handleValueChange}
          disabled={disabled}
        >
          <SelectTrigger id="dataset-select">
            <SelectValue placeholder="Wähle einen zugehörigen Datensatz" />
          </SelectTrigger>
          <SelectContent>
            {datasets.map((dataset) => (
              <SelectItem key={dataset.exam_name} value={dataset.exam_name}>
                {dataset.exam_name}
              </SelectItem>
            ))}
            <SelectItem value="__create_new__" className="text-primary font-medium">
              <div className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Neuen Datensatz erstellen
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Neuen Datensatz erstellen</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-dataset-name">Name des Datensatzes *</Label>
              <Input
                id="new-dataset-name"
                value={newDatasetName}
                onChange={(e) => setNewDatasetName(e.target.value)}
                placeholder="z. B. Biochemie SS 2025"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newDatasetName.trim()) {
                    handleCreateDataset();
                  }
                }}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateDialogOpen(false);
                setNewDatasetName('');
              }}
            >
              Abbrechen
            </Button>
            <Button
              onClick={handleCreateDataset}
              disabled={!newDatasetName.trim()}
            >
              Erstellen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default DatasetSelector;

