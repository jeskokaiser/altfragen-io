import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { AlertTriangle, CheckCircle2, Crown, Info, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const calloutVariants = cva('flex gap-3 rounded-lg border p-4 text-sm leading-relaxed', {
  variants: {
    variant: {
      info: 'border-transparent bg-primary-subtle text-primary-strong',
      success: 'border-success-border bg-success-subtle text-success-strong',
      warning: 'border-warning-border bg-warning-subtle text-warning-strong',
      danger: 'border-danger-border bg-danger-subtle text-danger-strong',
      premium: 'border-premium-border bg-premium-subtle text-premium-strong',
      neutral: 'border-border bg-muted text-foreground',
    },
  },
  defaultVariants: { variant: 'info' },
});

const icons = {
  info: { Icon: Info, cls: 'text-primary' },
  success: { Icon: CheckCircle2, cls: 'text-success' },
  warning: { Icon: AlertTriangle, cls: 'text-warning' },
  danger: { Icon: XCircle, cls: 'text-danger' },
  premium: { Icon: Crown, cls: 'text-premium' },
  neutral: { Icon: Info, cls: 'text-muted-foreground' },
};

export interface CalloutProps
  extends
    Omit<React.HTMLAttributes<HTMLDivElement>, 'title'>,
    VariantProps<typeof calloutVariants> {
  title?: React.ReactNode;
  icon?: React.ReactNode | false;
  action?: React.ReactNode;
}

/** A hint box: info, success, warning, danger, premium or neutral. */
export function Callout({
  className,
  variant,
  title,
  icon,
  action,
  children,
  ...props
}: CalloutProps) {
  const { Icon, cls } = icons[variant ?? 'info'];
  const role = variant === 'danger' || variant === 'warning' ? 'alert' : undefined;
  return (
    <div role={role} className={cn(calloutVariants({ variant }), className)} {...props}>
      {icon !== false && (
        <span aria-hidden="true" className={cn('mt-0.5 shrink-0 [&_svg]:size-4', cls)}>
          {icon ?? <Icon />}
        </span>
      )}
      <div className="min-w-0 flex-1 space-y-1">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div>{children}</div>}
        {action && <div className="pt-2">{action}</div>}
      </div>
    </div>
  );
}
