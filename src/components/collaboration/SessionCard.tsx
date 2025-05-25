
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExamSession } from '@/types/ExamSession';
import { Users, Clock, BookOpen } from 'lucide-react';
import { format } from 'date-fns';

interface SessionCardProps {
  session: ExamSession;
  onJoin: (sessionId: string) => void;
  participantCount?: number;
  questionCount?: number;
}

const SessionCard: React.FC<SessionCardProps> = ({
  session,
  onJoin,
  participantCount = 0,
  questionCount = 0
}) => {
  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{session.title}</CardTitle>
          <Badge variant={session.is_active ? 'default' : 'secondary'}>
            {session.is_active ? 'Aktiv' : 'Geschlossen'}
          </Badge>
        </div>
        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
          <div className="flex items-center">
            <BookOpen className="w-4 h-4 mr-1" />
            {session.subject}
          </div>
          <div className="flex items-center">
            <Clock className="w-4 h-4 mr-1" />
            {format(new Date(session.created_at), 'dd.MM.yyyy')}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {session.description && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {session.description}
          </p>
        )}
        
        <div className="flex justify-between items-center">
          <div className="flex space-x-4 text-sm">
            <div className="flex items-center">
              <Users className="w-4 h-4 mr-1" />
              {participantCount} Teilnehmer
            </div>
            <div>
              {questionCount} Fragen
            </div>
          </div>
          
          {session.is_active && (
            <Button 
              size="sm" 
              onClick={() => onJoin(session.id)}
            >
              Beitreten
            </Button>
          )}
        </div>
        
        {session.semester && session.year && (
          <div className="mt-2 text-xs text-muted-foreground">
            {session.semester} {session.year}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SessionCard;
