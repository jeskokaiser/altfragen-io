import * as React from 'react';
import { AlertTriangle, Inbox, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

/** What will appear here, and the next action. */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-6 py-10 text-center',
        className,
      )}
    >
      <span aria-hidden="true" className="text-muted-foreground [&_svg]:size-8">
        {icon ?? <Inbox />}
      </span>
      <p className="font-semibold">{title}</p>
      {description && <p className="max-w-md text-sm text-muted-foreground">{description}</p>}
      {action && <div className="pt-2">{action}</div>}
    </div>
  );
}

/** What went wrong, and "Erneut versuchen". */
export function ErrorState({
  title = 'Das hat nicht geklappt.',
  description,
  onRetry,
  className,
}: {
  title?: React.ReactNode;
  description?: React.ReactNode;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center justify-center gap-2 rounded-lg border border-danger-border bg-danger-subtle px-6 py-8 text-center text-danger-strong',
        className,
      )}
    >
      <AlertTriangle aria-hidden="true" className="size-6 text-danger" />
      <p className="font-semibold">{title}</p>
      {description && <p className="max-w-md text-sm">{description}</p>}
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="mt-2">
          Erneut versuchen
        </Button>
      )}
    </div>
  );
}

/** Full-area loading placeholder. `label` is announced to screen readers. */
export function LoadingState({
  label = 'Wird geladen …',
  variant = 'spinner',
  className,
}: {
  label?: string;
  variant?: 'spinner' | 'skeleton';
  className?: string;
}) {
  if (variant === 'skeleton') {
    return (
      <div role="status" aria-label={label} className={cn('space-y-3', className)}>
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }
  return (
    <div
      role="status"
      className={cn(
        'flex min-h-[40dvh] items-center justify-center gap-2 text-sm text-muted-foreground',
        className,
      )}
    >
      <Loader2 aria-hidden="true" className="size-5 animate-spin" />
      <span>{label}</span>
    </div>
  );
}
