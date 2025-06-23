
import { useMemo } from 'react';
import { Question } from '@/types/Question';

interface UseQuestionFilteringProps {
  questions: Question[] | undefined;
  userId: string | undefined;
  universityId?: string | null;
  selectedSemester: string | null;
  selectedYear: string | null;
  isDatasetArchived: (filename: string) => boolean;
  filterType: 'personal' | 'university';
}

export const useQuestionFiltering = ({
  questions,
  userId,
  universityId,
  selectedSemester,
  selectedYear,
  isDatasetArchived,
  filterType
}: UseQuestionFilteringProps) => {
  return useMemo(() => {
    if (!questions) return [];
    
    let filtered = questions;
    
    if (filterType === 'personal') {
      filtered = questions.filter(q => 
        !isDatasetArchived(q.filename) && 
        q.user_id === userId &&
        q.visibility === 'private'
      );
    } else {
      filtered = questions.filter(q => {
        return q.visibility === 'university' && q.university_id === universityId;
      });
    }
    
    if (selectedSemester) {
      filtered = filtered.filter(q => q.semester === selectedSemester);
    }
    
    if (selectedYear) {
      filtered = filtered.filter(q => q.year === selectedYear);
    }
    
    return filtered;
  }, [questions, userId, universityId, selectedSemester, selectedYear, isDatasetArchived, filterType]);
};
