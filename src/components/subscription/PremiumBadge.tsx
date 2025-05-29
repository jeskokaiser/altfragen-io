
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Brain } from 'lucide-react';

interface PremiumBadgeProps {
  className?: string;
}

const PremiumBadge: React.FC<PremiumBadgeProps> = ({ className = '' }) => {
  return (
    <Badge 
      variant="secondary" 
      className={`bg-blue-100 text-blue-800 border-blue-300 ${className}`}
    >
      <Brain className="h-3 w-3 mr-1" />
      Premium
    </Badge>
  );
};

export default PremiumBadge;
