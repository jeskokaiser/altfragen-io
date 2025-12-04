import React, { useMemo, useRef, useState, useEffect, useCallback } from 'react';
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
import { supabase } from '@/integrations/supabase/client';

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
  const [questionCount, setQuestionCount] = useState<number | null>(null);
  const [isCalculatingCount, setIsCalculatingCount] = useState(false);
  const [progressDataLoaded, setProgressDataLoaded] = useState(false);
  const formRef = useRef<FilterFormRef>(null);
  const calculationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const questionResultsRef = useRef<Map<string, boolean>>(new Map());
  const attemptsCountRef = useRef<Map<string, number>>(new Map());

  // Update title when defaultTitle changes or dialog opens
  useEffect(() => {
    if (open && defaultTitle) {
      setTitle(defaultTitle);
    }
  }, [open, defaultTitle]);

  const loadUserProgress = useCallback(async () => {
    try {
      if (!user?.id) return;
      
      // Get question IDs in batches to avoid URL length limits
      const questionIds = questions.map(q => q.id);
      const BATCH_SIZE = 500;
      const resultsMap = new Map<string, boolean>();
      const attemptsMap = new Map<string, number>();
      
      // Process in batches
      for (let i = 0; i < questionIds.length; i += BATCH_SIZE) {
        const batch = questionIds.slice(i, i + BATCH_SIZE);
        
        // Query both session_question_progress (prioritized) and user_progress (fallback)
        const [sessionProgressResult, userProgressResult] = await Promise.all([
          supabase
            .from('session_question_progress')
            .select('question_id, is_correct, attempts_count, created_at, updated_at')
            .eq('user_id', user.id)
            .in('question_id', batch)
            .order('updated_at', { ascending: false }),
          supabase
            .from('user_progress')
            .select('question_id, is_correct, attempts_count, created_at, updated_at')
            .eq('user_id', user.id)
            .in('question_id', batch)
        ]);
        
        // Process session_question_progress first (newer system, takes priority)
        // Aggregate latest progress per question across all sessions
        const sessionProgressByQuestion = new Map<string, any>();
        if (sessionProgressResult.data) {
          sessionProgressResult.data.forEach(progress => {
            const existing = sessionProgressByQuestion.get(progress.question_id);
            // Keep the most recent progress per question
            if (!existing || (progress.updated_at && (!existing.updated_at || progress.updated_at > existing.updated_at))) {
              sessionProgressByQuestion.set(progress.question_id, progress);
            }
          });
        }
        
        // Process aggregated session progress
        sessionProgressByQuestion.forEach(progress => {
          if (progress.is_correct !== null) {
            resultsMap.set(progress.question_id, progress.is_correct);
          }
          if (progress.attempts_count !== null) {
            attemptsMap.set(progress.question_id, progress.attempts_count);
          }
        });
        
        // Process user_progress as fallback (only for questions not in session_question_progress)
        if (userProgressResult.data) {
          userProgressResult.data.forEach(progress => {
            // Only use if we don't have session progress for this question
            if (!sessionProgressByQuestion.has(progress.question_id)) {
              if (progress.is_correct !== null && !resultsMap.has(progress.question_id)) {
                resultsMap.set(progress.question_id, progress.is_correct);
              }
              if (progress.attempts_count !== null && !attemptsMap.has(progress.question_id)) {
                attemptsMap.set(progress.question_id, progress.attempts_count);
              }
            }
          });
        }
        
        if (sessionProgressResult.error) {
          console.error('Error loading session progress batch:', sessionProgressResult.error);
        }
        if (userProgressResult.error) {
          console.error('Error loading user progress batch:', userProgressResult.error);
        }
      }
      
      questionResultsRef.current = resultsMap;
      attemptsCountRef.current = attemptsMap;
      setProgressDataLoaded(true);
    } catch (error) {
      console.error('Error loading user progress:', error);
      setProgressDataLoaded(true); // Set to true even on error to allow calculation
    }
  }, [user?.id, questions]);

  const subjects = useMemo(() => Array.from(new Set(questions.map(q => q.subject).filter(Boolean))), [questions]);
  const years = useMemo(() => Array.from(new Set(questions.map(q => q.year).filter(Boolean))) as string[], [questions]);

  // Calculate question count based on current filter settings
  const calculateQuestionCount = useCallback(async (values: FormValues) => {
    if (!user?.id || !formRef.current) return;
    
    setIsCalculatingCount(true);
    try {
      const filtered = await filterQuestions(questions, values, questionResultsRef.current, user.id);
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
        values.sortDirection
      );
      
      setQuestionCount(prioritized.length);
    } catch (error) {
      console.error('Error calculating question count:', error);
      setQuestionCount(null);
    } finally {
      setIsCalculatingCount(false);
    }
  }, [questions, user?.id]);

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
  const handleFormChange = useCallback((values: FormValues) => {
    // Clear existing timeout
    if (calculationTimeoutRef.current) {
      clearTimeout(calculationTimeoutRef.current);
    }
    
    // Debounce calculation to avoid excessive API calls
    calculationTimeoutRef.current = setTimeout(() => {
      calculateQuestionCount(values);
    }, 300);
  }, [calculateQuestionCount]);

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

      const filtered = await filterQuestions(questions, values, questionResultsRef.current, user.id);
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

          <FilterForm ref={formRef} subjects={subjects} years={years} onSubmit={() => {}} onChange={handleFormChange} />
        </div>

        <div className="flex justify-between items-center pt-4 border-t mt-4">
          <div className="text-sm text-muted-foreground">
            {isCalculatingCount ? (
              <span>Berechne...</span>
            ) : questionCount !== null ? (
              <span>{questionCount} {questionCount === 1 ? 'Frage' : 'Fragen'} werden in dieser Session sein</span>
            ) : (
              <span>Wähle Filter aus, um die Anzahl zu sehen</span>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>Abbrechen</Button>
            <Button onClick={handleCreate} disabled={isSubmitting}>Session erstellen</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TrainingSessionCreateDialog;
