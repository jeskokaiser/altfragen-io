import { Badge } from '@/components/ui/badge';

type SessionStatus = 'active' | 'paused' | 'completed' | string;

const sessionStatus: Record<
  string,
  { label: string; variant: 'info' | 'warning' | 'success' | 'secondary' }
> = {
  active: { label: 'Aktiv', variant: 'info' },
  paused: { label: 'Pausiert', variant: 'warning' },
  completed: { label: 'Abgeschlossen', variant: 'success' },
};

/** Session status as a badge with text, never colour alone. */
export function SessionStatusBadge({ status }: { status: SessionStatus }) {
  const s = sessionStatus[status] ?? { label: status, variant: 'secondary' as const };
  return <Badge variant={s.variant}>{s.label}</Badge>;
}

/** Days until an exam: warning within a week, neutral otherwise. */
export function DaysUntilBadge({ days }: { days: number }) {
  if (days < 0) return <Badge variant="secondary">Vorbei</Badge>;
  if (days === 0) return <Badge variant="destructive">Heute</Badge>;
  const label = days === 1 ? 'Morgen' : `in ${days} Tagen`;
  return <Badge variant={days <= 7 ? 'warning' : 'secondary'}>{label}</Badge>;
}
