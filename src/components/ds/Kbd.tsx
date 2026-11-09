import { cn } from '@/lib/utils';

/** A keyboard shortcut chip. Hidden from screen readers when the button text already names the action. */
export function Kbd({ className, ...props }: React.HTMLAttributes<HTMLElement>) {
  return (
    <kbd
      className={cn(
        'inline-flex min-w-[1.5rem] items-center justify-center rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-xs font-normal leading-none text-muted-foreground',
        className,
      )}
      {...props}
    />
  );
}
