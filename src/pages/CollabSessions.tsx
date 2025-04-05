
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus } from 'lucide-react';
import { fetchExamSessions } from '@/services/ExamSessionService';
import SessionsList from '@/components/collab/SessionsList';
import { useAuth } from '@/contexts/AuthContext';
import { ExamSession } from '@/types/ExamSession';

const CollabSessions: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>('active');

  const { data: sessions, isLoading, refetch } = useQuery({
    queryKey: ['exam-sessions'],
    queryFn: fetchExamSessions,
    enabled: !!user,
  });

  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);
  
  const activeSessions = sessions?.filter(session => session.is_active) || [];
  const closedSessions = sessions?.filter(session => !session.is_active) || [];

  // User's sessions (where they are the creator)
  const userSessions = sessions?.filter(session => session.creator_id === user?.id) || [];
  const userActiveSessions = userSessions.filter(session => session.is_active);
  const userClosedSessions = userSessions.filter(session => !session.is_active);

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">Exam Collaboration</h1>
        <Button onClick={() => navigate('/collab/create')}>
          <Plus className="mr-2 h-4 w-4" />
          New Session
        </Button>
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Tabs defaultValue="active" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="active">
                Active Sessions ({activeSessions.length})
              </TabsTrigger>
              <TabsTrigger value="closed">
                Closed Sessions ({closedSessions.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="active">
              <SessionsList sessions={activeSessions} loading={isLoading} />
            </TabsContent>

            <TabsContent value="closed">
              <SessionsList sessions={closedSessions} loading={isLoading} />
            </TabsContent>
          </Tabs>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Your Sessions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {userActiveSessions.length > 0 ? (
                <div>
                  <h3 className="text-sm font-medium mb-2">Active ({userActiveSessions.length})</h3>
                  {userActiveSessions.slice(0, 3).map((session) => (
                    <Button
                      key={session.id}
                      variant="outline"
                      className="w-full justify-start mb-2 text-left"
                      onClick={() => navigate(`/collab-session/${session.id}`)}
                    >
                      {session.title}
                    </Button>
                  ))}
                  {userActiveSessions.length > 3 && (
                    <p className="text-xs text-muted-foreground text-center">
                      +{userActiveSessions.length - 3} more
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No active sessions</p>
              )}

              {userClosedSessions.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium mb-2">Closed ({userClosedSessions.length})</h3>
                  {userClosedSessions.slice(0, 2).map((session) => (
                    <Button
                      key={session.id}
                      variant="ghost"
                      className="w-full justify-start mb-2 text-left"
                      onClick={() => navigate(`/collab-session/${session.id}`)}
                    >
                      {session.title}
                    </Button>
                  ))}
                  {userClosedSessions.length > 2 && (
                    <p className="text-xs text-muted-foreground text-center">
                      +{userClosedSessions.length - 2} more
                    </p>
                  )}
                </div>
              )}

              <div className="pt-2">
                <Button
                  variant="default"
                  className="w-full"
                  onClick={() => navigate('/collab/create')}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create New Session
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="mt-4">
            <CardHeader>
              <CardTitle>How It Works</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>
                <span className="font-medium">Create a Session:</span> Start a new collaborative session for an exam.
              </p>
              <p>
                <span className="font-medium">Add Questions:</span> Contribute questions you remember from the exam.
              </p>
              <p>
                <span className="font-medium">Collaborate:</span> Work with classmates to compile a complete set of questions.
              </p>
              <p>
                <span className="font-medium">Publish:</span> Save the questions to your personal question bank for training.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CollabSessions;
