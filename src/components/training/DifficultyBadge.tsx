import React from 'react';
import { Badge } from '@/components/ui/badge';

interface DifficultyBadgeProps {
  attemptsCount?: number;
  semester?: string;
  year?: string;
  subject?: string;
}

const DifficultyBadge: React.FC<DifficultyBadgeProps> = ({
  attemptsCount = 0,
  semester,
  year,
  subject,
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
