
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface QuestionSummary {
  id: string;
  filename: string;
  subject: string;
  difficulty: number;
  visibility: 'private' | 'university' | 'public';
  user_id: string | null;
  university_id: string | null;
  semester: string | null;
  year: string | null;
  exam_name: string | null;
  created_at: string;
}

interface SemesterYearFilterProps {
  questions: QuestionSummary[];
  selectedSemester: string | null;
  selectedYear: string | null;
  onSemesterChange: (semester: string | null) => void;
  onYearChange: (year: string | null) => void;
  onClearFilters: () => void;
  title?: string;
}

const SemesterYearFilter = ({
  questions,
  selectedSemester,
  selectedYear,
  onSemesterChange,
  onYearChange,
  onClearFilters,
  title = "Filter"
}: SemesterYearFilterProps) => {
  const uniqueSemesters = [...new Set(questions.map(q => q.semester).filter(Boolean))].sort();
  const uniqueYears = [...new Set(questions.map(q => q.year).filter(Boolean))].sort().reverse();

  const hasActiveFilters = selectedSemester || selectedYear;

  return (
    <div className="bg-slate-50/50 dark:bg-black/20 p-4 rounded-lg border">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="flex flex-wrap gap-2 flex-1">
          <Select value={selectedSemester || undefined} onValueChange={(value) => onSemesterChange(value || null)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Semester" />
            </SelectTrigger>
            <SelectContent>
              {uniqueSemesters.map(semester => (
                <SelectItem key={semester} value={semester!}>
                  {semester}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedYear || undefined} onValueChange={(value) => onYearChange(value || null)}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Jahr" />
            </SelectTrigger>
            <SelectContent>
              {uniqueYears.map(year => (
                <SelectItem key={year} value={year!}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {hasActiveFilters && (
          <Button
            variant="outline"
            size="sm"
            onClick={onClearFilters}
            className="flex items-center gap-1"
          >
            <X className="h-3 w-3" />
            Filter zurücksetzen
          </Button>
        )}
      </div>
    </div>
  );
};

export default SemesterYearFilter;
