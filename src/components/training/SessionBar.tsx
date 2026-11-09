import React from 'react';
import { MessageSquare, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface SessionBarProps {
  currentIndex: number;
  totalQuestions: number;
  onQuit: () => void;
  commentsCount: number;
  commentsOpen: boolean;
  onToggleComments: () => void;
  headingRef?: React.Ref<HTMLHeadingElement>;
}

/** One bar under the navigation: progress left, comments and "Unterbrechen" right. */
const SessionBar: React.FC<SessionBarProps> = ({
  currentIndex,
  totalQuestions,
  onQuit,
  commentsCount,
  commentsOpen,
  onToggleComments,
  headingRef,
}) => {
  const position = currentIndex + 1;
  return (
    <div className="sticky top-16 z-bar -mx-4 mb-4 border-b bg-background/95 px-4 py-2 backdrop-blur supports-[backdrop-filter]:bg-background/85 md:mx-0 md:px-0">
      <div className="flex items-center gap-2">
        <div className="min-w-0 flex-1 space-y-1.5 pr-2">
          <h1
            ref={headingRef}
            tabIndex={-1}
            className="text-sm font-semibold tabular-nums focus-visible:ring-0 focus-visible:ring-offset-0"
          >
            Frage {position} von {totalQuestions}
          </h1>
          <Progress
            value={(position / totalQuestions) * 100}
            aria-label={`Fortschritt: Frage ${position} von ${totalQuestions}`}
          />
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleComments}
          aria-expanded={commentsOpen}
          aria-controls="comments-panel"
        >
          <MessageSquare aria-hidden="true" />
          <span className="hidden sm:inline">Kommentare</span>
          <span className="sr-only sm:hidden">Kommentare</span>
          {commentsCount > 0 && (
            <span className="rounded-full bg-muted px-1.5 text-xs font-semibold tabular-nums text-foreground">
              {commentsCount}
              <span className="sr-only"> vorhanden</span>
            </span>
          )}
        </Button>
        <Button variant="ghost" size="sm" onClick={onQuit}>
          <Pause aria-hidden="true" />
          <span className="hidden sm:inline">Unterbrechen</span>
          <span className="sr-only sm:hidden">Session unterbrechen</span>
        </Button>
      </div>
    </div>
  );
};

export default SessionBar;
