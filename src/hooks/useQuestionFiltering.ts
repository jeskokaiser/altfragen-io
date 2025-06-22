
import { useMemo } from 'react';

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

interface UseQuestionFilteringProps {
  questions: QuestionSummary[] | undefined;
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
