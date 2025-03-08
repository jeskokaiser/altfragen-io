
import React from 'react';
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DifficultyFieldProps {
  defaultValue: string;
  onValueChange: (value: string) => void;
}

export const DifficultyField: React.FC<DifficultyFieldProps> = ({ defaultValue, onValueChange }) => {
  return (
    <div>
      <Label htmlFor="difficulty">Schwierigkeitsgrad</Label>
      <Select onValueChange={onValueChange} defaultValue={defaultValue}>
        <SelectTrigger>
          <SelectValue placeholder="Wähle einen Schwierigkeitsgrad" />
        </SelectTrigger>
        <SelectContent>
          {[1, 2, 3, 4, 5].map((level) => (
            <SelectItem key={level} value={level.toString()}>
              {level} {level === 1 ? '(Sehr leicht)' : level === 5 ? '(Sehr schwer)' : ''}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
