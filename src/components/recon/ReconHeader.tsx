import React from 'react';
import { Button } from '@/components/ui/button';

interface ReconHeaderProps {
  title: string;
  subtitle?: string | React.ReactNode;
  actions?: React.ReactNode;
}

export const ReconHeader: React.FC<ReconHeaderProps> = ({ title, subtitle, actions }) => {
  return (
    <div className="flex items-start justify-between gap-4 flex-wrap">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">{title}</h1>
        {subtitle && (
          typeof subtitle === 'string' ? (
            <p className="text-muted-foreground">{subtitle}</p>
          ) : (
            <div className="text-muted-foreground">{subtitle}</div>
          )
        )}
      </div>
      {actions && <div className="flex gap-2 flex-wrap">{actions}</div>}
    </div>
  );
};
