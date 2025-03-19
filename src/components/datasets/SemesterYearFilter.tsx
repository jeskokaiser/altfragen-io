
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
import { FilterX, Folders } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SemesterYearFilterProps {
  questions: Question[];
  selectedSemester: string | null;
  selectedYear: number | null;
  selectedDataset: string | null;
  onSemesterChange: (semester: string | null) => void;
  onYearChange: (year: number | null) => void;
  onDatasetChange?: (dataset: string | null) => void;
  onClearFilters: () => void;
  showDatasetFilter?: boolean;
  title?: string;
}

const SemesterYearFilter: React.FC<SemesterYearFilterProps> = ({
  questions,
  selectedSemester,
  selectedYear,
  selectedDataset,
  onSemesterChange,
  onYearChange,
  onDatasetChange,
  onClearFilters,
  showDatasetFilter = false,
  title = "Filter",
}) => {
  // Extract unique semesters and years from questions
  const uniqueSemesters = Array.from(
    new Set(
      questions
        .filter(q => q.semester)
        .map(q => q.semester)
    )
  ).sort();
  
  const uniqueYears = Array.from(
    new Set(
      questions
        .filter(q => q.year)
        .map(q => q.year)
    )
  ).sort((a, b) => b! - a!); // Sort years in descending order

  // Extract unique datasets (filenames)
  const uniqueDatasets = Array.from(
    new Set(
      questions.map(q => q.filename)
    )
  ).sort();

  const hasFilters = !!(selectedSemester || selectedYear || selectedDataset);

  return (
    <Card className="p-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
        <div className={`grid gap-4 w-full ${showDatasetFilter ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
          <div className="space-y-2">
            <Label htmlFor="semester-filter">Semester</Label>
            <Select
              value={selectedSemester || undefined}
              onValueChange={(value) => onSemesterChange(value || null)}
            >
              <SelectTrigger id="semester-filter" className="w-full">
                <SelectValue placeholder="Alle Semester" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Semester</SelectItem>
                {uniqueSemesters.map((semester) => (
                  <SelectItem key={semester} value={semester!}>
                    {semester}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="year-filter">Jahr</Label>
            <Select
              value={selectedYear?.toString() || undefined}
              onValueChange={(value) => onYearChange(value ? parseInt(value) : null)}
            >
              <SelectTrigger id="year-filter" className="w-full">
                <SelectValue placeholder="Alle Jahre" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Jahre</SelectItem>
                {uniqueYears.map((year) => (
                  <SelectItem key={year} value={year!.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {showDatasetFilter && onDatasetChange && (
            <div className="space-y-2">
              <Label htmlFor="dataset-filter">Datensatz</Label>
              <Select
                value={selectedDataset || undefined}
                onValueChange={(value) => onDatasetChange(value || null)}
              >
                <SelectTrigger id="dataset-filter" className="w-full">
                  <SelectValue placeholder="Alle Datensätze" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Datensätze</SelectItem>
                  {uniqueDatasets.map((dataset) => (
                    <SelectItem key={dataset} value={dataset}>
                      {dataset}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
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
