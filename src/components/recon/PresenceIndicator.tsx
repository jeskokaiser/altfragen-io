import React from 'react';
import { Badge } from '@/components/ui/badge';

interface PresenceIndicatorProps {
  viewing: number;
  editing: number;
}

export const PresenceIndicator: React.FC<PresenceIndicatorProps> = ({ viewing, editing }) => {
  const total = viewing + editing;
  
  if (total === 0) {
    return null;
  }

  const parts: string[] = [];
  if (editing > 0) {
    parts.push(`${editing} ${editing === 1 ? 'bearbeitet' : 'bearbeiten'} gerade`);
  }
  if (viewing > 0) {
    parts.push(`${viewing} ${viewing === 1 ? 'schaut zu' : 'schauen zu'}`);
  }

  return (
    <Badge variant="outline" className="text-xs">
      {parts.join(' • ')}
    </Badge>
  );
};
