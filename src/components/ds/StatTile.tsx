import * as React from 'react';
import { cn } from '@/lib/utils';

interface StatTileProps extends React.HTMLAttributes<HTMLDivElement> {
  label: React.ReactNode;
  value: React.ReactNode;
  hint?: React.ReactNode;
  tone?: 'default' | 'success' | 'danger' | 'warning' | 'primary';
}

const toneClass = {
  default: 'text-foreground',
  success: 'text-success-strong',
  danger: 'text-danger-strong',
  warning: 'text-warning-strong',
  primary: 'text-primary-strong',
};

/** Label, figure, hint. Used for the key figures on dashboard, exams and analytics. */
export function StatTile({
  label,
  value,
  hint,
  tone = 'default',
  className,
  ...props
}: StatTileProps) {
  return (
    <div className={cn('rounded-lg border bg-card p-4', className)} {...props}>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={cn('mt-1 text-2xl font-bold tabular-nums', toneClass[tone])}>{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
