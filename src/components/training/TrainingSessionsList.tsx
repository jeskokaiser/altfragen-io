import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useTrainingSessions } from '@/hooks/useTrainingSessions';
import { useNavigate } from 'react-router-dom';

const TrainingSessionsList: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { sessions, isLoading, deleteSession } = useTrainingSessions(user?.id);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  if (isLoading) {
    return <div>Sessions werden geladen…</div>;
  }

  return (
    <div className="grid gap-4">
      {(sessions || []).map(session => (
        <Card key={session.id}>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base font-medium">
              {session.title}
            </CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{session.status}</span>
            </div>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {session.current_index + 1}/{session.total_questions} Fragen
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => navigate(`/training/session/${session.id}`)}>Fortsetzen</Button>
              <Button variant="secondary" onClick={() => navigate(`/training/session/${session.id}/analytics`)}>Auswertung</Button>
              <Button variant="destructive" disabled={deletingId === session.id} onClick={async () => {
                setDeletingId(session.id);
                try { await deleteSession(session.id); } finally { setDeletingId(null); }
              }}>Löschen</Button>
            </div>
          </CardContent>
        </Card>
      ))}

      {(sessions || []).length === 0 && (
        <div className="text-sm text-muted-foreground">Keine Sessions vorhanden.</div>
      )}
    </div>
  );
};

export default TrainingSessionsList;
