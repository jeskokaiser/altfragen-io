import React, { useMemo, forwardRef, useImperativeHandle, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Form } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Slider } from "@/components/ui/slider";
import SubjectSelect from './selects/SubjectSelect';
import DifficultySelect from './selects/DifficultySelect';
import QuestionCountSelect from './selects/QuestionCountSelect';
import ExamYearSelect from './selects/ExamYearSelect';
import ExamSemesterSelect from './selects/ExamSemesterSelect';
import { FormValues } from './types/FormValues';

interface FilterFormProps {
  subjects: string[];
  years: string[];
  onSubmit: (values: FormValues) => void;
  onChange?: (values: FormValues) => void;
}

export interface FilterFormRef {
  getValues: () => FormValues;
  submit: () => void;
}

const FilterForm = forwardRef<FilterFormRef, FilterFormProps>(({ subjects, years, onSubmit, onChange }, ref) => {
  const numericYears = useMemo(() => {
    return years
      .map(year => parseInt(year))
      .filter(year => !isNaN(year))
      .sort((a, b) => a - b);
  }, [years]);

  const minYear = numericYears.length > 0 ? numericYears[0] : 2000;
  const maxYear = numericYears.length > 0 ? numericYears[numericYears.length - 1] : new Date().getFullYear();

  const form = useForm<FormValues>({
    defaultValues: {
      subjects: [],
      difficulty: 'all',
      questionCount: 20,
      isRandomSelection: false,
      sortByAttempts: false,
      sortDirection: 'desc',
      wrongQuestionsOnly: false,
      newQuestionsOnly: false,
      excludeTodaysQuestions: false,
      questionsWithImagesOnly: false,
      yearRange: [minYear, maxYear],
      examYear: 'all',
      examSemester: 'all',
    },
    mode: 'onChange',
  });

  const isRandomMode = form.watch('isRandomSelection');
  const isSortingEnabled = form.watch('sortByAttempts');
  const yearRange = form.watch('yearRange');
  const wrongQuestionsOnly = form.watch('wrongQuestionsOnly');
  const newQuestionsOnly = form.watch('newQuestionsOnly');
  
  // Watch all form fields that could change
  const selectedSubjects = form.watch('subjects');
  const difficulty = form.watch('difficulty');
  const questionCount = form.watch('questionCount');
  const sortDirection = form.watch('sortDirection');
  const excludeTodaysQuestions = form.watch('excludeTodaysQuestions');
  const questionsWithImagesOnly = form.watch('questionsWithImagesOnly');
  const examYear = form.watch('examYear');
  const examSemester = form.watch('examSemester');

  // Watch all form values and notify parent on change
  const onChangeRef = React.useRef(onChange);
  const lastValuesRef = React.useRef<string>('');
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  
  // Keep ref updated
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);
  
  // Watch all form values and only notify when they actually change
  useEffect(() => {
    // Clear any pending timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Get current values
    const currentValues = form.getValues();
    const valuesString = JSON.stringify(currentValues);
    
    // Only call onChange if values actually changed
    if (valuesString !== lastValuesRef.current) {
      lastValuesRef.current = valuesString;
      // Debounce the onChange call
      timeoutRef.current = setTimeout(() => {
        if (onChangeRef.current) {
          onChangeRef.current(currentValues);
        }
      }, 100);
    }
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [
    isRandomMode,
    isSortingEnabled,
    yearRange,
    wrongQuestionsOnly,
    newQuestionsOnly,
    selectedSubjects,
    difficulty,
    questionCount,
    sortDirection,
    excludeTodaysQuestions,
    questionsWithImagesOnly,
    examYear,
    examSemester,
    form
  ]);

  useImperativeHandle(ref, () => ({
    getValues: () => form.getValues(),
    submit: () => form.handleSubmit(onSubmit)(),
  }));

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <DifficultySelect form={form} />
        
        <div className={`space-y-6 ${isRandomMode ? 'opacity-50 pointer-events-none' : ''}`}>
          <SubjectSelect form={form} subjects={subjects} />
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Prüfungsjahre</Label>
              <span className="text-sm text-muted-foreground">
                {yearRange[0]} - {yearRange[1]}
              </span>
            </div>
            <Slider
              defaultValue={[minYear, maxYear]}
              min={minYear}
              max={maxYear}
              step={1}
              value={yearRange}
              onValueChange={(value) => form.setValue('yearRange', value as [number, number])}
              disabled={isRandomMode}
              className="my-4"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <ExamYearSelect form={form} years={years} disabled={isRandomMode} />
            <ExamSemesterSelect form={form} disabled={isRandomMode} />
          </div>
        </div>
        
        <QuestionCountSelect form={form} />
        
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={isRandomMode}
                      onCheckedChange={(checked) => form.setValue('isRandomSelection', checked)}
                      id="random-mode"
                    />
                    <Label htmlFor="random-mode">Zufällige Auswahl</Label>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Bei zufälliger Auswahl werden die Filter für Fach, Jahr und Semester ignoriert</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <div className="flex items-center space-x-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={wrongQuestionsOnly}
                      onCheckedChange={(checked) => {
                        if (checked && newQuestionsOnly) {
                          form.setValue('newQuestionsOnly', false);
                        }
                        form.setValue('wrongQuestionsOnly', checked);
                      }}
                      id="wrong-questions"
                      disabled={isRandomMode}
                    />
                    <Label htmlFor="wrong-questions">Nur falsche Fragen</Label>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Nur Fragen auswählen, die bisher falsch beantwortet wurden</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <div className="flex items-center space-x-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={newQuestionsOnly}
                      onCheckedChange={(checked) => {
                        if (checked && wrongQuestionsOnly) {
                          form.setValue('wrongQuestionsOnly', false);
                        }
                        if (checked && isSortingEnabled) {
                          form.setValue('sortByAttempts', false);
                        }
                        form.setValue('newQuestionsOnly', checked);
                      }}
                      id="new-questions"
                      disabled={isRandomMode}
                    />
                    <Label htmlFor="new-questions">Nur neue Fragen</Label>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Nur Fragen auswählen, die noch nie beantwortet wurden</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <div className="flex items-center space-x-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={form.watch('excludeTodaysQuestions')}
                      onCheckedChange={(checked) => form.setValue('excludeTodaysQuestions', checked)}
                      id="exclude-todays-questions"
                      disabled={isRandomMode}
                    />
                    <Label htmlFor="exclude-todays-questions">Nur Fragen die ich heute noch nicht hatte</Label>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Nur Fragen auswählen, die heute noch nicht beantwortet wurden</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <div className="flex items-center space-x-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={form.watch('questionsWithImagesOnly')}
                      onCheckedChange={(checked) => form.setValue('questionsWithImagesOnly', checked)}
                      id="questions-with-images"
                      disabled={isRandomMode}
                    />
                    <Label htmlFor="questions-with-images">Nur Fragen mit Bildern</Label>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Nur Fragen auswählen, die ein Bild enthalten</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={isSortingEnabled}
                        onCheckedChange={(checked) => {
                          if (checked && newQuestionsOnly) {
                            form.setValue('newQuestionsOnly', false);
                          }
                          form.setValue('sortByAttempts', checked);
                        }}
                        id="sort-by-attempts"
                        disabled={isRandomMode || newQuestionsOnly}
                      />
                      <Label htmlFor="sort-by-attempts">Nach Versuchen sortieren</Label>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Sortiert Fragen nach Anzahl der Versuche{newQuestionsOnly ? ' (nicht verfügbar bei neuen Fragen)' : ''}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            {isSortingEnabled && !isRandomMode && (
              <div className="ml-8">
                <RadioGroup
                  defaultValue="desc"
                  value={form.watch('sortDirection')}
                  onValueChange={(value: 'asc' | 'desc') => form.setValue('sortDirection', value)}
                  className="flex flex-col space-y-1"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="desc" id="sort-desc" />
                    <Label htmlFor="sort-desc">Meiste Versuche zuerst</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="asc" id="sort-asc" />
                    <Label htmlFor="sort-asc">Wenigste Versuche zuerst</Label>
                  </div>
                </RadioGroup>
              </div>
            )}
          </div>
        </div>
      </form>
    </Form>
  );
});

FilterForm.displayName = 'FilterForm';

export default FilterForm;
