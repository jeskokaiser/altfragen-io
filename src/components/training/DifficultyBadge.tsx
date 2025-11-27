
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { User } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface DifficultyBadgeProps {
  difficulty: number;
  attemptsCount?: number;
  isPersonalized?: boolean;
  semester?: string;
  year?: string;
  subject?: string;
}

const DifficultyBadge: React.FC<DifficultyBadgeProps> = ({ 
  difficulty, 
  attemptsCount = 0,
  isPersonalized = false,
  semester,
  year,
  subject
}) => {
  

  // Combine semester and year into one badge
  const semesterYear = semester && year ? `${semester} ${year}` : null;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Badge variant="outline" className="text-xs">
        Versuche: {attemptsCount}
      </Badge>
      
      {subject && (
        <Badge variant="outline" className="text-xs">
          {subject}
        </Badge>
      )}
      
      {semesterYear && (
        <Badge variant="outline" className="text-xs">
          {semesterYear}
        </Badge>
      )}
    </div>
  );
};

export default DifficultyBadge;
