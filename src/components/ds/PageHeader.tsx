import * as React from 'react';
import { cn } from '@/lib/utils';

/** Page title, description and actions. One per page; the title is the page's h1. */
export function PageHeader({
  title,
  description,
  actions,
  eyebrow,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  eyebrow?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'mb-6 flex flex-col gap-4 md:mb-8 md:flex-row md:items-end md:justify-between',
        className,
      )}
    >
      <div className="min-w-0 space-y-1">
        {eyebrow && <div className="text-sm text-muted-foreground">{eyebrow}</div>}
        <h1 className="text-2xl font-semibold leading-tight md:text-3xl">{title}</h1>
        {description && <p className="text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

/** The page frame: max 1200 px, 16/24 px gutter, 24/32 px vertical rhythm. */
export function Page({
  className,
  width = 'page',
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { width?: 'page' | 'reading' | 'narrow' }) {
  const max = { page: 'max-w-page', reading: 'max-w-reading', narrow: 'max-w-2xl' }[width];
  return (
    <div
      className={cn(
        'mx-auto w-full px-4 py-6 duration-200 animate-in fade-in-0 md:px-6 md:py-8',
        max,
        className,
      )}
      {...props}
    />
  );
}
