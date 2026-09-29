import React, { useMemo, useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useUpcomingExam } from '@/hooks/useUpcomingExams';
import { listExamNameCounts } from '@/services/UpcomingExamService';

interface ExamQuestionSelectorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  examId: string | null;
  onConfirm: (selectedExamNames: string[]) => Promise<void> | void;
}

const ExamQuestionSelectorDialog: React.FC<ExamQuestionSelectorDialogProps> = ({
  open,
  onOpenChange,
  examId,
  onConfirm,
}) => {
  const { user, universityId } = useAuth();
  const [tab, setTab] = useState<'personal' | 'university' | 'public'>('personal');
  const [search, setSearch] = useState('');
  const [selectedExamNames, setSelectedExamNames] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch current exam's exam_name to pre-select
  const { data: currentExam } = useUpcomingExam(examId, open);

  // Initialize selected exam names from current exam
  useEffect(() => {
    if (currentExam?.exam_name && open) {
      // Split comma-separated exam_names if multiple
      const names = currentExam.exam_name
        .split(',')
        .map((n: string) => n.trim())
        .filter(Boolean);
      setSelectedExamNames(new Set(names));
    } else if (open && !currentExam?.exam_name) {
      setSelectedExamNames(new Set());
    }
  }, [currentExam, open]);

  // Exam names per tab, with how many questions carry each
  const { data: personalExamNames, isLoading: isLoadingPersonal } = useQuery({
    queryKey: ['exam-names', 'private', user?.id],
    queryFn: () => (user?.id ? listExamNameCounts({ visibility: 'private', userId: user.id }) : []),
    enabled: !!user?.id && open && tab === 'personal',
  });

  const { data: universityExamNames, isLoading: isLoadingUniversity } = useQuery({
    queryKey: ['exam-names', 'university', universityId],
    queryFn: () =>
      universityId ? listExamNameCounts({ visibility: 'university', universityId }) : [],
    enabled: !!universityId && open && tab === 'university',
  });

  const { data: publicExamNames, isLoading: isLoadingPublic } = useQuery({
    queryKey: ['exam-names', 'public'],
    queryFn: () => listExamNameCounts({ visibility: 'public' }),
    enabled: open && tab === 'public',
  });

  const currentExamNames =
    tab === 'personal'
      ? personalExamNames || []
      : tab === 'university'
        ? universityExamNames || []
        : publicExamNames || [];

  const isLoading =
    tab === 'personal'
      ? isLoadingPersonal
      : tab === 'university'
        ? isLoadingUniversity
        : isLoadingPublic;

  const filteredExamNames = useMemo(() => {
    const lower = search.toLowerCase();
    return currentExamNames.filter((item) => item.exam_name.toLowerCase().includes(lower));
  }, [currentExamNames, search]);

  const toggleExamName = (examName: string) => {
    setSelectedExamNames((prev) => {
      const next = new Set(prev);
      if (next.has(examName)) {
        next.delete(examName);
      } else {
        next.add(examName);
      }
      return next;
    });
  };

  const handleConfirm = async () => {
    const selected = Array.from(selectedExamNames);
    if (selected.length === 0) {
      onOpenChange(false);
      return;
    }

    setIsSubmitting(true);
    try {
      await onConfirm(selected);
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Prüfung auswählen</DialogTitle>
        </DialogHeader>
        <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
          <TabsList>
            <TabsTrigger value="personal">Privat</TabsTrigger>
            <TabsTrigger value="university">Universität</TabsTrigger>
            <TabsTrigger value="public">Öffentlich</TabsTrigger>
          </TabsList>
          <div className="py-3">
            <Input
              placeholder="Suchen..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <TabsContent value="personal">
            <div className="max-h-80 overflow-auto space-y-2">
              {isLoading ? (
                <div className="text-sm text-muted-foreground py-4">Lade Prüfungen...</div>
              ) : filteredExamNames.length === 0 ? (
                <div className="text-sm text-muted-foreground py-4">
                  Keine passenden Prüfungen gefunden.
                </div>
              ) : (
                filteredExamNames.map((item) => (
                  <label
                    key={item.exam_name}
                    className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/50 p-2 rounded"
                  >
                    <Checkbox
                      checked={selectedExamNames.has(item.exam_name)}
                      onCheckedChange={() => toggleExamName(item.exam_name)}
                    />
                    <div className="flex-1">
                      <div className="font-medium">{item.exam_name}</div>
                      <div className="text-muted-foreground">{item.count} Fragen</div>
                    </div>
                  </label>
                ))
              )}
            </div>
          </TabsContent>
          <TabsContent value="university">
            <div className="max-h-80 overflow-auto space-y-2">
              {isLoading ? (
                <div className="text-sm text-muted-foreground py-4">Lade Prüfungen...</div>
              ) : filteredExamNames.length === 0 ? (
                <div className="text-sm text-muted-foreground py-4">
                  Keine passenden Prüfungen gefunden.
                </div>
              ) : (
                filteredExamNames.map((item) => (
                  <label
                    key={item.exam_name}
                    className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/50 p-2 rounded"
                  >
                    <Checkbox
                      checked={selectedExamNames.has(item.exam_name)}
                      onCheckedChange={() => toggleExamName(item.exam_name)}
                    />
                    <div className="flex-1">
                      <div className="font-medium">{item.exam_name}</div>
                      <div className="text-muted-foreground">{item.count} Fragen</div>
                    </div>
                  </label>
                ))
              )}
            </div>
          </TabsContent>
          <TabsContent value="public">
            <div className="max-h-80 overflow-auto space-y-2">
              {isLoading ? (
                <div className="text-sm text-muted-foreground py-4">Lade Prüfungen...</div>
              ) : filteredExamNames.length === 0 ? (
                <div className="text-sm text-muted-foreground py-4">
                  Keine passenden Prüfungen gefunden.
                </div>
              ) : (
                filteredExamNames.map((item) => (
                  <label
                    key={item.exam_name}
                    className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/50 p-2 rounded"
                  >
                    <Checkbox
                      checked={selectedExamNames.has(item.exam_name)}
                      onCheckedChange={() => toggleExamName(item.exam_name)}
                    />
                    <div className="flex-1">
                      <div className="font-medium">{item.exam_name}</div>
                      <div className="text-muted-foreground">{item.count} Fragen</div>
                    </div>
                  </label>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
        <div className="flex justify-between items-center pt-2">
          <div className="text-sm text-muted-foreground">
            {selectedExamNames.size > 0 && `${selectedExamNames.size} Prüfung(en) ausgewählt`}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Abbrechen
            </Button>
            <Button onClick={handleConfirm} disabled={isSubmitting}>
              Speichern
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExamQuestionSelectorDialog;
