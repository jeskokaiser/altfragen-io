import React, { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import type { Question } from '@/types/Question';

interface ExamQuestionSelectorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  personalDatasets: Record<string, Question[]>;
  universityDatasets: Record<string, Question[]>;
  onConfirm: (selectedIds: string[]) => Promise<void> | void;
}

const ExamQuestionSelectorDialog: React.FC<ExamQuestionSelectorDialogProps> = ({ open, onOpenChange, personalDatasets, universityDatasets, onConfirm }) => {
  const [tab, setTab] = useState<'personal' | 'university'>('personal');
  const [search, setSearch] = useState('');
  const [selectedDatasets, setSelectedDatasets] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredPersonal = useMemo(() => {
    const lower = search.toLowerCase();
    return Object.entries(personalDatasets || {}).filter(([key]) => key.toLowerCase().includes(lower));
  }, [personalDatasets, search]);

  const filteredUniversity = useMemo(() => {
    const lower = search.toLowerCase();
    return Object.entries(universityDatasets || {}).filter(([key]) => key.toLowerCase().includes(lower));
  }, [universityDatasets, search]);

  const toggleDataset = (scope: 'personal' | 'university', key: string) => {
    const id = `${scope}:${key}`;
    setSelectedDatasets(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleConfirm = async () => {
    const selectedKeys = Object.keys(selectedDatasets).filter(k => selectedDatasets[k]);
    if (selectedKeys.length === 0) { onOpenChange(false); return; }

    const questionIds: string[] = [];
    selectedKeys.forEach(k => {
      const [scope, key] = k.split(':');
      const list = scope === 'personal' ? personalDatasets[key] : universityDatasets[key];
      if (list && list.length) {
        list.forEach(q => questionIds.push(q.id));
      }
    });

    setIsSubmitting(true);
    try {
      await onConfirm(questionIds);
      setSelectedDatasets({});
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Fragen verknüpfen</DialogTitle>
        </DialogHeader>
        <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
          <TabsList>
            <TabsTrigger value="personal">Eigene Datensätze</TabsTrigger>
            <TabsTrigger value="university">Universität</TabsTrigger>
          </TabsList>
          <div className="py-3">
            <Input placeholder="Suchen..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <TabsContent value="personal">
            <div className="max-h-80 overflow-auto space-y-2">
              {filteredPersonal.map(([key, list]) => (
                <label key={key} className="flex items-center gap-2 text-sm">
                  <Checkbox checked={!!selectedDatasets[`personal:${key}`]} onCheckedChange={() => toggleDataset('personal', key)} />
                  <div className="flex-1">
                    <div className="font-medium">{key}</div>
                    <div className="text-muted-foreground">{list.length} Fragen</div>
                  </div>
                </label>
              ))}
              {filteredPersonal.length === 0 && (
                <div className="text-sm text-muted-foreground py-4">Keine passenden Datensätze.</div>
              )}
            </div>
          </TabsContent>
          <TabsContent value="university">
            <div className="max-h-80 overflow-auto space-y-2">
              {filteredUniversity.map(([key, list]) => (
                <label key={key} className="flex items-center gap-2 text-sm">
                  <Checkbox checked={!!selectedDatasets[`university:${key}`]} onCheckedChange={() => toggleDataset('university', key)} />
                  <div className="flex-1">
                    <div className="font-medium">{key}</div>
                    <div className="text-muted-foreground">{list.length} Fragen</div>
                  </div>
                </label>
              ))}
              {filteredUniversity.length === 0 && (
                <div className="text-sm text-muted-foreground py-4">Keine passenden Datensätze.</div>
              )}
            </div>
          </TabsContent>
        </Tabs>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>Abbrechen</Button>
          <Button onClick={handleConfirm} disabled={isSubmitting}>Verknüpfen</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExamQuestionSelectorDialog;


