
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Crown } from 'lucide-react';

interface PremiumBadgeProps {
  className?: string;
}

const PremiumBadge: React.FC<PremiumBadgeProps> = ({ className = '' }) => {
  return (
    <Badge 
      variant="secondary" 
      className={`bg-yellow-100 text-yellow-800 border-yellow-300 ${className}`}
    >
      <Crown className="h-3 w-3 mr-1" />
      Premium
    </Badge>
  );
};

export default PremiumBadge;
