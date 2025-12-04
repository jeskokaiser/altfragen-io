
import React from 'react';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import { UseFormReturn } from 'react-hook-form';
import { FormValues } from '../types/FormValues';

interface SubjectSelectProps {
  form: UseFormReturn<FormValues>;
  subjects: string[];
}

const SubjectSelect: React.FC<SubjectSelectProps> = ({ form, subjects }) => {
  const selectedSubjects = form.watch('subjects') || [];
  const sortedSubjects = [...subjects]
    .slice()
    .sort((a, b) => (a || '').localeCompare(b || ''));

  const handleSubjectToggle = (subject: string, checked: boolean) => {
    const currentSubjects = form.getValues('subjects') || [];
    const newSubjects = checked
      ? [...currentSubjects, subject]
      : currentSubjects.filter(s => s !== subject);
    form.setValue('subjects', newSubjects, { shouldDirty: true, shouldValidate: true });
  };

  const handleSelectAll = () => {
    form.setValue('subjects', [], { shouldDirty: true, shouldValidate: true });
  };

  const getDisplayText = () => {
    const subjectsArray = Array.isArray(selectedSubjects) ? selectedSubjects : [];
    if (subjectsArray.length === 0) {
      return 'Alle Fächer';
    }
    if (subjectsArray.length === 1) {
      return subjectsArray[0];
    }
    return `${subjectsArray.length} Fächer ausgewählt`;
  };

  return (
    <FormField
      control={form.control}
      name="subjects"
      render={({ field }) => {
        // Ensure field value is always an array
        const fieldValue = Array.isArray(field.value) ? field.value : [];
        
        return (
          <FormItem>
            <FormLabel>Fach auswählen</FormLabel>
            <FormControl>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    <span className="truncate">{getDisplayText()}</span>
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 max-h-[300px] overflow-y-auto">
                  <DropdownMenuLabel>Fächer auswählen</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuCheckboxItem
                    checked={fieldValue.length === 0}
                    onCheckedChange={handleSelectAll}
                  >
                    Alle Fächer
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuSeparator />
                  {sortedSubjects.map((subject) => (
                    <DropdownMenuCheckboxItem
                      key={subject || 'unknown'}
                      checked={fieldValue.includes(subject || 'unknown')}
                      onCheckedChange={(checked) => handleSubjectToggle(subject || 'unknown', checked)}
                    >
                      {subject}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </FormControl>
          </FormItem>
        );
      }}
    />
  );
};

export default SubjectSelect;
