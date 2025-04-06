
import React from 'react';
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSubjects } from '@/hooks/useSubjects';

interface SubjectFieldProps {
  defaultValue: string;
  onValueChange: (value: string) => void;
}

export const SubjectField: React.FC<SubjectFieldProps> = ({ defaultValue, onValueChange }) => {
  const subjects = useSubjects();

  return (
    <div>
      <Label htmlFor="subject">Fach</Label>
      <Select onValueChange={onValueChange} defaultValue={defaultValue || 'unknown'}>
        <SelectTrigger>
          <SelectValue placeholder="Wähle ein Fach" />
        </SelectTrigger>
        <SelectContent>
          {subjects.map((subject) => (
            <SelectItem key={subject} value={subject || 'unknown'}>
              {subject}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
