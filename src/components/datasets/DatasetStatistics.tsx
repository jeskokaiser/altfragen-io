
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  Users, 
  Eye, 
  EyeOff,
  Calendar,
  BookOpen
} from 'lucide-react';

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

interface DatasetStatisticsProps {
  questions: QuestionSummary[];
}

const DatasetStatistics = ({ questions }: DatasetStatisticsProps) => {
  const totalQuestions = questions.length;
  const avgDifficulty = totalQuestions > 0 
    ? Math.round(questions.reduce((sum, q) => sum + q.difficulty, 0) / totalQuestions * 10) / 10
    : 0;
  
  const subjects = [...new Set(questions.map(q => q.subject))];
  const visibilityType = questions[0]?.visibility || 'private';
  
  const getVisibilityIcon = (visibility: string) => {
    switch (visibility) {
      case 'public':
        return <Users className="h-3 w-3" />;
      case 'university':
        return <Eye className="h-3 w-3" />;
      default:
        return <EyeOff className="h-3 w-3" />;
    }
  };
  
  const getVisibilityLabel = (visibility: string) => {
    switch (visibility) {
      case 'public':
        return 'Öffentlich';
      case 'university':
        return 'Universität';
      default:
        return 'Privat';
    }
  };

  const semester = questions[0]?.semester;
  const year = questions[0]?.year;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="space-y-1">
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <BarChart3 className="h-4 w-4" />
          <span>Fragen</span>
        </div>
        <p className="text-xl font-semibold">{totalQuestions}</p>
      </div>
      
      <div className="space-y-1">
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <BarChart3 className="h-4 w-4" />
          <span>Ø Schwierigkeit</span>
        </div>
        <p className="text-xl font-semibold">{avgDifficulty}</p>
      </div>
      
      <div className="space-y-1">
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <BookOpen className="h-4 w-4" />
          <span>Fächer</span>
        </div>
        <div className="flex flex-wrap gap-1">
          {subjects.slice(0, 2).map(subject => (
            <Badge key={subject} variant="secondary" className="text-xs">
              {subject}
            </Badge>
          ))}
          {subjects.length > 2 && (
            <Badge variant="outline" className="text-xs">
              +{subjects.length - 2}
            </Badge>
          )}
        </div>
      </div>
      
      <div className="space-y-1">
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          {getVisibilityIcon(visibilityType)}
          <span>Sichtbarkeit</span>
        </div>
        <Badge variant="outline" className="text-xs">
          {getVisibilityLabel(visibilityType)}
        </Badge>
        
        {(semester || year) && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
            <Calendar className="h-3 w-3" />
            <span>{semester} {year}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default DatasetStatistics;
