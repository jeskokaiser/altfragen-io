
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { ExamSession } from '@/types/ExamSession';
import { format } from 'date-fns';

interface SessionsListProps {
  sessions: ExamSession[];
  loading: boolean;
}

const SessionsList: React.FC<SessionsListProps> = ({ sessions, loading }) => {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
            </CardContent>
            <CardFooter>
              <div className="h-9 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <Card className="text-center p-6">
        <CardContent className="pt-6">
          <p className="text-muted-foreground mb-4">No active exam sessions found</p>
          <Button onClick={() => navigate('/collab/create')}>Create New Session</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {sessions.map((session) => (
        <Card key={session.id} className={!session.is_active ? 'opacity-70' : ''}>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <CardTitle className="text-lg">{session.title}</CardTitle>
              {!session.is_active && (
                <Badge variant="outline" className="bg-gray-200 dark:bg-gray-700">
                  Closed
                </Badge>
              )}
            </div>
            <CardDescription>
              {session.subject}
              {session.semester && session.year && ` - ${session.semester} ${session.year}`}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p className="line-clamp-2">{session.description || 'No description provided'}</p>
            <p className="mt-2">
              Created {format(new Date(session.created_at), 'MMM d, yyyy')}
            </p>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={() => navigate(`/collab-session/${session.id}`)} 
              variant={session.is_active ? 'default' : 'outline'}
              className="w-full"
            >
              {session.is_active ? 'Join Session' : 'View Session'}
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
};

export default SessionsList;
