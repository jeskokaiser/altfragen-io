import React, { useMemo, useRef, useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useTrainingSessions } from '@/hooks/useTrainingSessions';
import { Question } from '@/types/Question';
import FilterForm, { FilterFormRef } from './FilterForm';
import { filterQuestions, prioritizeQuestions } from '@/utils/questionFilters';
import { FormValues } from './types/FormValues';
import { toast } from 'sonner';
import { fetchTrainingProgressMaps } from '@/services/UserProgressService';

interface TrainingSessionCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  questions: Question[]; // source list to filter from
  defaultTitle?: string;
  onCreated?: (sessionId: string) => void;
  context?: Record<string, unknown>; // extra metadata to embed in filter_settings (e.g., { source: 'exam', examId })
}

const TrainingSessionCreateDialog: React.FC<TrainingSessionCreateDialogProps> = ({
  open,
  onOpenChange,
  questions: sourceQuestions,
  defaultTitle,
  onCreated,
  context,
}) => {
  const { user } = useAuth();
  const { createSession } = useTrainingSessions(user?.id);
  const [title, setTitle] = useState(defaultTitle || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [questionCount, setQuestionCount] = useState<number | null>(null);
  const [isCalculatingCount, setIsCalculatingCount] = useState(false);
  const [progressDataLoaded, setProgressDataLoaded] = useState(false);
  const formRef = useRef<FilterFormRef>(null);
  const calculationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  // 'all' or one exam_name ("B1", "C2" ...): the question set a user picks before the filters
  const [examName, setExamName] = useState('all');

  const examNames = useMemo(
    () =>
      Array.from(
        new Set(sourceQuestions.map((q) => q.exam_name).filter((n): n is string => !!n)),
      ).sort((a, b) => a.localeCompare(b, 'de', { numeric: true })),
    [sourceQuestions],
  );

  const questions = useMemo(
    () =>
      examName === 'all'
        ? sourceQuestions
        : sourceQuestions.filter((q) => q.exam_name === examName),
    [sourceQuestions, examName],
  );
  const questionResultsRef = useRef<Map<string, boolean>>(new Map());
  const attemptsCountRef = useRef<Map<string, number>>(new Map());

  // Update title when defaultTitle changes or dialog opens
  useEffect(() => {
    if (open && defaultTitle) {
      setTitle(defaultTitle);
    }
  }, [open, defaultTitle]);

  useEffect(() => {
    if (open) setExamName('all');
  }, [open]);

  const loadUserProgress = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { results, attempts } = await fetchTrainingProgressMaps(
        user.id,
        sourceQuestions.map((q) => q.id),
      );

      questionResultsRef.current = results;
      attemptsCountRef.current = attempts;
    } catch (error) {
      console.error('Error loading user progress:', error);
    } finally {
      // Set even on error, so the count calculation is not blocked forever.
      setProgressDataLoaded(true);
    }
  }, [user?.id, sourceQuestions]);

  const subjects = useMemo(
    () => Array.from(new Set(questions.map((q) => q.subject).filter(Boolean))),
    [questions],
  );
  const years = useMemo(
    () => Array.from(new Set(questions.map((q) => q.year).filter(Boolean))) as string[],
    [questions],
  );

  // Calculate question count based on current filter settings
  const calculateQuestionCount = useCallback(
    async (values: FormValues) => {
      if (!user?.id || !formRef.current) return;

      setIsCalculatingCount(true);
      try {
        const filtered = await filterQuestions(
          questions,
          values,
          questionResultsRef.current,
          user.id,
        );
        if (filtered.length === 0) {
          setQuestionCount(0);
          return;
        }

        const prioritized = prioritizeQuestions(
          filtered,
          questionResultsRef.current,
          values.questionCount,
          values.isRandomSelection,
          values.sortByAttempts,
          attemptsCountRef.current,
          values.sortDirection,
        );

        setQuestionCount(prioritized.length);
      } catch (error) {
        console.error('Error calculating question count:', error);
        setQuestionCount(null);
      } finally {
        setIsCalculatingCount(false);
      }
    },
    [questions, user?.id],
  );

  // Load user progress data when dialog opens
  useEffect(() => {
    if (open && user?.id) {
      setProgressDataLoaded(false);
      loadUserProgress();
    } else {
      // Reset when dialog closes
      questionResultsRef.current = new Map();
      attemptsCountRef.current = new Map();
      setQuestionCount(null);
      setProgressDataLoaded(false);
    }
  }, [open, user?.id, loadUserProgress]);

  // Trigger initial calculation once when dialog opens and form is ready
  useEffect(() => {
    if (open && formRef.current && user?.id && progressDataLoaded) {
      // Small delay to ensure form is fully initialized
      const timer = setTimeout(() => {
        const values = formRef.current?.getValues();
        if (values) {
          calculateQuestionCount(values);
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [open, progressDataLoaded, user?.id, calculateQuestionCount]);

  // Handle form changes with debouncing
  const handleFormChange = useCallback(
    (values: FormValues) => {
      // Clear existing timeout
      if (calculationTimeoutRef.current) {
        clearTimeout(calculationTimeoutRef.current);
      }

      // Debounce calculation to avoid excessive API calls
      calculationTimeoutRef.current = setTimeout(() => {
        calculateQuestionCount(values);
      }, 300);
    },
    [calculateQuestionCount],
  );

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (calculationTimeoutRef.current) {
        clearTimeout(calculationTimeoutRef.current);
      }
    };
  }, []);

  const handleCreate = async () => {
    if (!user?.id) return;
    if (!formRef.current) return;
    setIsSubmitting(true);
    try {
      const values: FormValues = formRef.current.getValues();

      const filtered = await filterQuestions(
        questions,
        values,
        questionResultsRef.current,
        user.id,
      );
      if (filtered.length === 0) {
        toast.error('Keine Fragen gefunden, die den Filterkriterien entsprechen.');
        return;
      }
      const prioritized = prioritizeQuestions(
        filtered,
        questionResultsRef.current,
        values.questionCount,
        values.isRandomSelection,
        values.sortByAttempts,
        attemptsCountRef.current,
        values.sortDirection,
      );

      if (prioritized.length === 0) {
        toast.error('Keine Fragen verfügbar für die Session.');
        return;
      }

      const session = await createSession({
        title: title,
        filter_settings: {
          ...values,
          ...(examName !== 'all' ? { examName } : {}),
          ...(context || {}),
        },
        question_ids: prioritized.map((q) => q.id),
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
          <DialogDescription>
            Wähle Filter aus und speichere sie als Session, die du jederzeit fortsetzen kannst.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 overflow-y-auto pr-2">
          <div className="space-y-2">
            <Label htmlFor="title">Titel</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="z. B. Innere Medizin – Falsch beantwortete"
            />
          </div>

          {examNames.length > 1 && (
            <div className="space-y-2">
              <Label htmlFor="exam-name">Fragensatz</Label>
              <Select value={examName} onValueChange={setExamName}>
                <SelectTrigger id="exam-name">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    Alle Fragensätze ({sourceQuestions.length} Fragen)
                  </SelectItem>
                  {examNames.map((name) => (
                    <SelectItem key={name} value={name}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <FilterForm
            // remount per question set so the year range starts at that set's years
            key={examName}
            ref={formRef}
            subjects={subjects}
            years={years}
            onSubmit={() => {}}
            onChange={handleFormChange}
          />
        </div>

        <div className="flex justify-between items-center pt-4 border-t mt-4">
          <div className="text-sm text-muted-foreground">
            {isCalculatingCount ? (
              <span>Berechne...</span>
            ) : questionCount !== null ? (
              <span>
                {questionCount} {questionCount === 1 ? 'Frage' : 'Fragen'} werden in dieser Session
                sein
              </span>
            ) : (
              <span>Wähle Filter aus, um die Anzahl zu sehen</span>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Abbrechen
            </Button>
            <Button onClick={handleCreate} disabled={isSubmitting}>
              Session erstellen
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TrainingSessionCreateDialog;
