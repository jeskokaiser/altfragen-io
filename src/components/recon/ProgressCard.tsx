import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface ProgressCardProps {
  current: number;
  total: number;
  label: string;
  description?: string;
}

export const ProgressCard: React.FC<ProgressCardProps> = ({ current, total, label, description }) => {
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{label}</CardTitle>
        {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{label}</span>
          <span className="font-medium">
            {current} von {total} ({percentage}%)
          </span>
        </div>
        <Progress value={percentage} className="h-2" />
      </CardContent>
    </Card>
  );
};
