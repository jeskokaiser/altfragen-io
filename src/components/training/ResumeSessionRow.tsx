import React from 'react';
import { Link } from 'react-router-dom';
import { PlayCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useTrainingSessions } from '@/hooks/useTrainingSessions';

/** "Weitermachen": the most recent unfinished session, one click away. Renders nothing without one. */
const ResumeSessionRow: React.FC<{ userId: string }> = ({ userId }) => {
  const { sessions } = useTrainingSessions(userId);
  // list() is ordered by updated_at, newest first.
  const session = sessions?.find(
    (s) => s.status !== 'completed' && s.current_index < s.total_questions,
  );
  if (!session) return null;

  const position = session.current_index + 1;
  return (
    <section
      aria-label="Weitermachen"
      className="flex flex-col gap-3 rounded-lg border border-primary/30 bg-primary-subtle p-4 sm:flex-row sm:items-center"
    >
      <div className="min-w-0 flex-1 space-y-2">
        <p className="text-sm text-primary-strong">Weitermachen</p>
        <p className="truncate font-semibold">{session.title}</p>
        <div className="flex items-center gap-3">
          <Progress
            value={(position / session.total_questions) * 100}
            className="max-w-xs bg-card"
            aria-hidden="true"
          />
          <span className="whitespace-nowrap text-sm tabular-nums text-muted-foreground">
            Frage {position} von {session.total_questions}
          </span>
        </div>
      </div>
      <Button asChild>
        <Link to={`/training/session/${session.id}`}>
          <PlayCircle aria-hidden="true" />
          Fortsetzen
        </Link>
      </Button>
    </section>
  );
};

export default ResumeSessionRow;
