import React, { useMemo, useRef, useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useTrainingSessions } from '@/hooks/useTrainingSessions';
import { Question } from '@/types/Question';
import FilterForm, { FilterFormRef } from './FilterForm';
import { filterQuestions, prioritizeQuestions } from '@/utils/questionFilters';
import { FormValues } from './types/FormValues';
import { toast } from 'sonner';

interface TrainingSessionCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  questions: Question[]; // source list to filter from
  defaultTitle?: string;
  onCreated?: (sessionId: string) => void;
  context?: Record<string, unknown>; // extra metadata to embed in filter_settings (e.g., { source: 'exam', examId })
}

const TrainingSessionCreateDialog: React.FC<TrainingSessionCreateDialogProps> = ({ open, onOpenChange, questions, defaultTitle, onCreated, context }) => {
  const { user } = useAuth();
  const { createSession } = useTrainingSessions(user?.id);
  const [title, setTitle] = useState(defaultTitle || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formRef = useRef<FilterFormRef>(null);

  // Update title when defaultTitle changes or dialog opens
  useEffect(() => {
    if (open && defaultTitle) {
      setTitle(defaultTitle);
    }
  }, [open, defaultTitle]);

  const subjects = useMemo(() => Array.from(new Set(questions.map(q => q.subject).filter(Boolean))), [questions]);
  const years = useMemo(() => Array.from(new Set(questions.map(q => q.year).filter(Boolean))) as string[], [questions]);

  const handleCreate = async () => {
    if (!user?.id) return;
    if (!formRef.current) return;
    setIsSubmitting(true);
    try {
      const values: FormValues = formRef.current.getValues();

      const questionResults = new Map<string, boolean>();
      const attemptsCount = new Map<string, number>();

      const filtered = await filterQuestions(questions, values, questionResults, user.id);
      if (filtered.length === 0) {
        toast.error('Keine Fragen gefunden, die den Filterkriterien entsprechen.');
        return;
      }
      const prioritized = prioritizeQuestions(
        filtered,
        questionResults,
        values.questionCount,
        values.isRandomSelection,
        values.sortByAttempts,
        attemptsCount,
        values.sortDirection
      );

      if (prioritized.length === 0) {
        toast.error('Keine Fragen verfügbar für die Session.');
        return;
      }

      const session = await createSession({
        title: title,
        filter_settings: { ...values, ...(context || {}) },
        question_ids: prioritized.map(q => q.id),
      });

      if (session?.id) {
        onOpenChange(false);
        onCreated?.(session.id);
        toast.success('Session erstellt');
      }
    } catch (e) {
      console.error(e);
      toast.error('Fehler beim Erstellen der Session');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Neue Trainings-Session</DialogTitle>
          <DialogDescription>Wähle Filter aus und speichere sie als Session, die du jederzeit fortsetzen kannst.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 overflow-y-auto pr-2">
          <div className="space-y-2">
            <Label htmlFor="title">Titel</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="z. B. Innere Medizin – Falsch beantwortete" />
          </div>

          <FilterForm ref={formRef} subjects={subjects} years={years} onSubmit={() => {}} />
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>Abbrechen</Button>
          <Button onClick={handleCreate} disabled={isSubmitting}>Session erstellen</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TrainingSessionCreateDialog;
