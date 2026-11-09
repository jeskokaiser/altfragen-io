import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Crown } from 'lucide-react';

interface PremiumBadgeProps {
  className?: string;
}

const PremiumBadge: React.FC<PremiumBadgeProps> = ({ className = '' }) => {
  return (
    <Badge variant="premium" className={className}>
      <Crown aria-hidden="true" className="text-premium" />
      Premium
    </Badge>
  );
};

export default PremiumBadge;
