import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { QuestionSearchFilters } from '@/types/QuestionSearchFilters';
import { X } from 'lucide-react';

interface SearchFiltersProps {
  filters: QuestionSearchFilters;
  onFiltersChange: (filters: QuestionSearchFilters) => void;
  filterOptions: {
    subjects: string[];
    examNames: string[];
    semesters: string[];
    years: string[];
  };
}

export const SearchFilters: React.FC<SearchFiltersProps> = ({
  filters,
  onFiltersChange,
  filterOptions
}) => {
  const handleFilterChange = (key: keyof QuestionSearchFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value === 'all' || value === '' ? null : value
    });
  };

  const handleVisibilityChange = (visibility: 'private' | 'university' | 'public', checked: boolean) => {
    const currentVisibility = filters.visibility || [];
    let newVisibility: ('private' | 'university' | 'public')[];
    
    if (checked) {
      newVisibility = [...currentVisibility, visibility];
    } else {
      newVisibility = currentVisibility.filter(v => v !== visibility);
    }
    
    onFiltersChange({
      ...filters,
      visibility: newVisibility.length > 0 ? newVisibility : null
    });
  };

  const handleClearFilters = () => {
    onFiltersChange({
      subject: null,
      examName: null,
      semester: null,
      year: null,
      difficulty: null,
      visibility: null,
      filename: null
    });
  };

  const hasActiveFilters = 
    filters.subject ||
    filters.examName ||
    filters.semester ||
    filters.year ||
    filters.difficulty !== null ||
    (filters.visibility && filters.visibility.length > 0) ||
    filters.filename;

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-card">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Filter</h3>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
            className="h-8 px-2"
          >
            <X className="h-4 w-4 mr-1" />
            Zurücksetzen
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Subject Filter */}
        <div className="space-y-2">
          <Label htmlFor="subject-filter">Fach</Label>
          <Select
            value={filters.subject || 'all'}
            onValueChange={(value) => handleFilterChange('subject', value)}
          >
            <SelectTrigger id="subject-filter">
              <SelectValue placeholder="Alle Fächer" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Fächer</SelectItem>
              {filterOptions.subjects
                .filter((subject) => subject && subject.trim() !== '')
                .map((subject) => (
                  <SelectItem key={subject} value={subject}>
                    {subject}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        {/* Exam Name/Module Filter */}
        <div className="space-y-2">
          <Label htmlFor="exam-name-filter">Modul/Prüfung</Label>
          <Select
            value={filters.examName || 'all'}
            onValueChange={(value) => handleFilterChange('examName', value)}
          >
            <SelectTrigger id="exam-name-filter">
              <SelectValue placeholder="Alle Module" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Module</SelectItem>
              {filterOptions.examNames
                .filter((examName) => examName && examName.trim() !== '')
                .map((examName) => (
                  <SelectItem key={examName} value={examName}>
                    {examName}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        {/* Semester Filter */}
        <div className="space-y-2">
          <Label htmlFor="semester-filter">Semester</Label>
          <Select
            value={filters.semester || 'all'}
            onValueChange={(value) => handleFilterChange('semester', value)}
          >
            <SelectTrigger id="semester-filter">
              <SelectValue placeholder="Alle Semester" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Semester</SelectItem>
              {filterOptions.semesters
                .filter((semester) => semester && semester.trim() !== '')
                .map((semester) => (
                  <SelectItem key={semester} value={semester}>
                    {semester}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        {/* Year Filter */}
        <div className="space-y-2">
          <Label htmlFor="year-filter">Jahr</Label>
          <Select
            value={filters.year || 'all'}
            onValueChange={(value) => handleFilterChange('year', value)}
          >
            <SelectTrigger id="year-filter">
              <SelectValue placeholder="Alle Jahre" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Jahre</SelectItem>
              {filterOptions.years
                .filter((year) => year && year.trim() !== '')
                .map((year) => (
                  <SelectItem key={year} value={year}>
                    {year}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        {/* Difficulty Filter */}
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="difficulty-filter">
            Schwierigkeit: {filters.difficulty !== null && filters.difficulty !== undefined ? filters.difficulty : 'Alle'}
          </Label>
          <div className="flex items-center gap-4">
            <Slider
              id="difficulty-filter"
              min={1}
              max={5}
              step={1}
              value={filters.difficulty !== null && filters.difficulty !== undefined ? [filters.difficulty] : [3]}
              onValueChange={(value) => handleFilterChange('difficulty', value[0])}
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleFilterChange('difficulty', null)}
              className="w-20"
            >
              Reset
            </Button>
          </div>
        </div>

        {/* Visibility Filter */}
        <div className="space-y-2 md:col-span-2">
          <Label>Sichtbarkeit</Label>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="visibility-private"
                checked={filters.visibility?.includes('private') || false}
                onCheckedChange={(checked) => handleVisibilityChange('private', checked as boolean)}
              />
              <Label htmlFor="visibility-private" className="font-normal cursor-pointer">
                Privat
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="visibility-university"
                checked={filters.visibility?.includes('university') || false}
                onCheckedChange={(checked) => handleVisibilityChange('university', checked as boolean)}
              />
              <Label htmlFor="visibility-university" className="font-normal cursor-pointer">
                Universität
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="visibility-public"
                checked={filters.visibility?.includes('public') || false}
                onCheckedChange={(checked) => handleVisibilityChange('public', checked as boolean)}
              />
              <Label htmlFor="visibility-public" className="font-normal cursor-pointer">
                Öffentlich
              </Label>
            </div>
          </div>
        </div>

        {/* Filename Filter */}
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="filename-filter">Dateiname (optional)</Label>
          <Input
            id="filename-filter"
            placeholder="Dateiname eingeben..."
            value={filters.filename || ''}
            onChange={(e) => handleFilterChange('filename', e.target.value)}
          />
        </div>
      </div>
    </div>
  );
};

