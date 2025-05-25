
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Users, Clock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { ExamSession } from '@/types/ExamSession';
import SessionCard from '@/components/collaboration/SessionCard';
import { joinCollaborationSession } from '@/services/CollaborationService';

const CollabSessions: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>('active');

  const { data: sessions, isLoading, refetch } = useQuery({
    queryKey: ['collaboration-sessions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exam_sessions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ExamSession[];
    },
    enabled: !!user,
  });

  const { data: participantCounts } = useQuery({
    queryKey: ['session-participant-counts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('session_participants')
        .select('session_id');

      if (error) throw error;

      const counts: Record<string, number> = {};
      data.forEach(p => {
        counts[p.session_id] = (counts[p.session_id] || 0) + 1;
      });
      return counts;
    },
    enabled: !!user,
  });

  const { data: questionCounts } = useQuery({
    queryKey: ['session-question-counts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('draft_questions')
        .select('session_id');

      if (error) throw error;

      const counts: Record<string, number> = {};
      data.forEach(q => {
        counts[q.session_id] = (counts[q.session_id] || 0) + 1;
      });
      return counts;
    },
    enabled: !!user,
  });

  const handleJoinSession = async (sessionId: string) => {
    if (!user) return;
    
    const success = await joinCollaborationSession(sessionId, user.id);
    if (success) {
      navigate(`/collab-session/${sessionId}`);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6 text-center">
        <div>Sitzungen werden geladen...</div>
      </div>
    );
  }

  const activeSessions = sessions?.filter(session => session.is_active) || [];
  const closedSessions = sessions?.filter(session => !session.is_active) || [];

  // User's sessions (where they are the creator)
  const userSessions = sessions?.filter(session => session.creator_id === user?.id) || [];
  const userActiveSessions = userSessions.filter(session => session.is_active);
  const userClosedSessions = userSessions.filter(session => !session.is_active);

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Zusammenarbeit</h1>
          <p className="text-muted-foreground">
            Sammelt gemeinsam Prüfungsfragen in Echtzeit
          </p>
        </div>
        <Button onClick={() => navigate('/collab/create')}>
          <Plus className="mr-2 h-4 w-4" />
          Neue Sitzung
        </Button>
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Tabs defaultValue="active" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="active">
                <Clock className="w-4 h-4 mr-2" />
                Aktive Sitzungen ({activeSessions.length})
              </TabsTrigger>
              <TabsTrigger value="closed">
                Geschlossene Sitzungen ({closedSessions.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="active" className="space-y-4">
              {activeSessions.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">Keine aktiven Sitzungen</h3>
                    <p className="text-muted-foreground mb-4">
                      Erstelle eine neue Sitzung, um gemeinsam mit deinen Kommilitonen Fragen zu sammeln.
                    </p>
                    <Button onClick={() => navigate('/collab/create')}>
                      <Plus className="mr-2 h-4 w-4" />
                      Sitzung erstellen
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {activeSessions.map((session) => (
                    <SessionCard
                      key={session.id}
                      session={session}
                      onJoin={handleJoinSession}
                      participantCount={participantCounts?.[session.id] || 0}
                      questionCount={questionCounts?.[session.id] || 0}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="closed" className="space-y-4">
              {closedSessions.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <p className="text-muted-foreground">Noch keine geschlossenen Sitzungen.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {closedSessions.map((session) => (
                    <SessionCard
                      key={session.id}
                      session={session}
                      onJoin={handleJoinSession}
                      participantCount={participantCounts?.[session.id] || 0}
                      questionCount={questionCounts?.[session.id] || 0}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Deine Sitzungen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {userActiveSessions.length > 0 ? (
                <div>
                  <h3 className="text-sm font-medium mb-2">Aktiv ({userActiveSessions.length})</h3>
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
                      +{userActiveSessions.length - 3} weitere
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Keine aktiven Sitzungen</p>
              )}

              {userClosedSessions.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium mb-2">Geschlossen ({userClosedSessions.length})</h3>
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
                      +{userClosedSessions.length - 2} weitere
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
                  Neue Sitzung erstellen
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>So funktioniert's</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-start space-x-2">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-semibold text-blue-600 mt-0.5">
                  1
                </div>
                <div>
                  <p className="font-medium">Sitzung erstellen</p>
                  <p className="text-muted-foreground">Direkt nach der Prüfung starten</p>
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-semibold text-blue-600 mt-0.5">
                  2
                </div>
                <div>
                  <p className="font-medium">Fragen sammeln</p>
                  <p className="text-muted-foreground">Jeder fügt Fragen hinzu, an die er sich erinnert</p>
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-semibold text-blue-600 mt-0.5">
                  3
                </div>
                <div>
                  <p className="font-medium">Gemeinsam überprüfen</p>
                  <p className="text-muted-foreground">Fragen als Team verifizieren und verbessern</p>
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-semibold text-blue-600 mt-0.5">
                  4
                </div>
                <div>
                  <p className="font-medium">Veröffentlichen</p>
                  <p className="text-muted-foreground">In deiner persönlichen Fragenbank speichern</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CollabSessions;
