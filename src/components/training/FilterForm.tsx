
import React, { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Slider } from "@/components/ui/slider";
import SubjectSelect from './selects/SubjectSelect';
import DifficultySelect from './selects/DifficultySelect';
import QuestionCountSelect from './selects/QuestionCountSelect';
import { FormValues } from './types/FormValues';

interface FilterFormProps {
  subjects: string[];
  years: string[];
  onSubmit: (values: FormValues) => void;
}

const FilterForm: React.FC<FilterFormProps> = ({ subjects, years, onSubmit }) => {
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
      subject: 'all',
      difficulty: 'all',
      questionCount: 20, // Changed from 'all' to number
      isRandomSelection: false,
      sortByAttempts: false,
      sortDirection: 'desc',
      wrongQuestionsOnly: false,
      yearRange: [minYear, maxYear],
    },
    mode: 'onChange',
  });

  const isRandomMode = form.watch('isRandomSelection');
  const isSortingEnabled = form.watch('sortByAttempts');
  const yearRange = form.watch('yearRange');

  const isFormValid = form.watch('subject') && 
                     form.watch('difficulty') && 
                     form.watch('questionCount') > 0;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className={`space-y-6 ${isRandomMode ? 'opacity-50 pointer-events-none' : ''}`}>
          <SubjectSelect form={form} subjects={subjects} />
          <DifficultySelect form={form} />
          
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
                  <p>Bei zufälliger Auswahl werden die Filter für Fach und Schwierigkeitsgrad ignoriert</p>
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
                      checked={form.watch('wrongQuestionsOnly')}
                      onCheckedChange={(checked) => form.setValue('wrongQuestionsOnly', checked)}
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

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={isSortingEnabled}
                        onCheckedChange={(checked) => form.setValue('sortByAttempts', checked)}
                        id="sort-by-attempts"
                        disabled={isRandomMode}
                      />
                      <Label htmlFor="sort-by-attempts">Nach Versuchen sortieren</Label>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Sortiert Fragen nach Anzahl der Versuche</p>
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

        {/* Remove the submit button from here since it's handled in the parent component */}
      </form>
    </Form>
  );
};

export default FilterForm;
