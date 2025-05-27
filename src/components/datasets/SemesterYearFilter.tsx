
import React from 'react';
import { Question } from '@/types/Question';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FilterX } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SemesterYearFilterProps {
  questions: Question[];
  selectedSemester: string | null;
  selectedYear: string | null;
  onSemesterChange: (semester: string | null) => void;
  onYearChange: (year: string | null) => void;
  onClearFilters: () => void;
  title?: string;
}

const SemesterYearFilter: React.FC<SemesterYearFilterProps> = ({
  questions,
  selectedSemester,
  selectedYear,
  onSemesterChange,
  onYearChange,
  onClearFilters,
  title = "Filter",
}) => {
  // Extract unique semesters from questions, ensuring we don't include empty values
  const uniqueSemesters = Array.from(
    new Set(
      questions
        .filter(q => q.semester && q.semester.trim() !== '')
        .map(q => q.semester)
    )
  ).sort();
  
  // Generate years from 2010 to current year
  const currentYear = new Date().getFullYear();
  const availableYears = Array.from({ length: currentYear - 2009 }, (_, i) => (currentYear - i).toString());

  const hasFilters = !!(selectedSemester || selectedYear);

  return (
    <Card className="p-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
        <div className="grid sm:grid-cols-2 gap-4 w-full sm:w-auto">
          <div className="space-y-2">
            <Label htmlFor="semester-filter">Semester</Label>
            <Select
              value={selectedSemester || undefined}
              onValueChange={(value) => onSemesterChange(value === 'all' ? null : value)}
            >
              <SelectTrigger id="semester-filter" className="w-full sm:w-[200px]">
                <SelectValue placeholder="Alle Semester" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Semester</SelectItem>
                {uniqueSemesters.map((semester) => (
                  <SelectItem key={semester} value={semester || 'unknown'}>
                    {semester}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="year-filter">Jahr</Label>
            <Select
              value={selectedYear || undefined}
              onValueChange={(value) => onYearChange(value === 'all' ? null : value)}
            >
              <SelectTrigger id="year-filter" className="w-full sm:w-[200px]">
                <SelectValue placeholder="Alle Jahre" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Jahre</SelectItem>
                {availableYears.map((year) => (
                  <SelectItem key={year} value={year}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {hasFilters && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onClearFilters}
            className="w-full sm:w-auto"
          >
            <FilterX className="mr-2 h-4 w-4" />
            Filter zurücksetzen
          </Button>
        )}
      </div>
    </Card>
  );
};

export default SemesterYearFilter;
