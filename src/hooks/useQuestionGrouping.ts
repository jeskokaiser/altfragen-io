
import { useMemo } from 'react';
import { Question } from '@/types/Question';

export const useQuestionGrouping = (questions: Question[]) => {
  return useMemo(() => {
    const grouped = questions.reduce((acc, question) => {
      const key = question.exam_name || question.filename;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(question);
      return acc;
    }, {} as Record<string, Question[]>);
    
    // Sort questions within each group
    Object.keys(grouped).forEach(key => {
      grouped[key].sort((a, b) => {
        if (a.year && b.year && a.year !== b.year) {
          return b.year.localeCompare(a.year);
        }
        
        if (a.semester && b.semester && a.semester !== b.semester) {
          const semA = a.semester.startsWith('WS') ? 1 : 2;
          const semB = b.semester.startsWith('WS') ? 1 : 2;
          return semA - semB;
        }
        
        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
      });
    });
    
    return grouped;
  }, [questions]);
};
