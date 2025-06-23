
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
}

const DifficultyBadge: React.FC<DifficultyBadgeProps> = ({ 
  difficulty, 
  attemptsCount = 0,
  isPersonalized = false,
  semester,
  year
}) => {
  const getDifficultyColor = (level: number) => {
    switch (level) {
      case 1: return 'bg-green-100 text-green-800';
      case 2: return 'bg-blue-100 text-blue-800';
      case 3: return 'bg-yellow-100 text-yellow-800';
      case 4: return 'bg-orange-100 text-orange-800';
      case 5: return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Combine semester and year into one badge
  const semesterYear = semester && year ? `${semester} ${year}` : null;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Badge className={`${getDifficultyColor(difficulty)}`}>
        Versuche: {attemptsCount}
      </Badge>
      
      {semesterYear && (
        <Badge variant="outline" className="text-xs">
          {semesterYear}
        </Badge>
      )}
      
      {isPersonalized && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center text-blue-500">
                <User size={14} />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Persönlicher Schwierigkeitsgrad</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
};

export default DifficultyBadge;
