import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Loader2, Users, AlertTriangle, Plus, Check, Share2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchExamSessionById, fetchSessionParticipants, fetchDraftQuestions, deleteDraftQuestion, closeExamSession, subscribeToSessionUpdates, joinSession, checkIsHost } from '@/services/ExamSessionService';
import QuestionCard from '@/components/collab/QuestionCard';
import AddQuestionForm from '@/components/collab/AddQuestionForm';
import EditQuestionForm from '@/components/collab/EditQuestionForm';
import ParticipantsList from '@/components/collab/ParticipantsList';
import PublishModal from '@/components/collab/PublishModal';
import { DraftQuestion, SessionParticipant, ExamSession, QuestionCardActiveUsers, ActiveUserInfo } from '@/types/ExamSession';
import { toast } from 'sonner';
import SessionActivityFeed from '@/components/collab/SessionActivityFeed';
import { supabase } from '@/integrations/supabase/client';
import { RealtimePresenceState } from '@supabase/supabase-js';

const SessionDetails: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [isHost, setIsHost] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<DraftQuestion | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState<string | null>(null);
  const [isCloseSessionDialogOpen, setIsCloseSessionDialogOpen] = useState(false);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [joinModalOpen, setJoinModalOpen] = useState(true);
  const [presenceState, setPresenceState] = useState<RealtimePresenceState<Record<string, any>>>({});
  const [sessionActivities, setSessionActivities] = useState<Array<{
    type: 'join' | 'leave' | 'create' | 'update' | 'delete' | 'review';
    userId: string;
    timestamp: string;
    questionId?: string;
    message?: string;
  }>>([]);
  
  const activeUsers: Record<string, ActiveUserInfo> = Object.entries(presenceState).reduce((acc, [key, values]) => {
    if (values && values.length > 0) {
      const userData = values[0];
      if (userData.user_id) {
        acc[userData.user_id] = {
          online_at: userData.online_at,
          presence_ref: key
        };
      }
    }
    return acc;
  }, {} as Record<string, ActiveUserInfo>);
  
  const questionCardActiveUsers: QuestionCardActiveUsers = Object.entries(activeUsers).reduce((acc, [userId, info]) => {
    acc[userId] = {
      lastActive: info.online_at
    };
    return acc;
  }, {} as QuestionCardActiveUsers);
  
  if (!sessionId) {
    navigate('/collab');
    return null;
  }

  const { data: session, isLoading: isSessionLoading, error: sessionError } = useQuery({
    queryKey: ['exam-session', sessionId],
    queryFn: () => fetchExamSessionById(sessionId),
    enabled: !!sessionId && !!user,
  });

  const { data: participants, isLoading: isParticipantsLoading, refetch: refetchParticipants } = useQuery({
    queryKey: ['session-participants', sessionId],
    queryFn: () => fetchSessionParticipants(sessionId),
    enabled: !!sessionId && !!user,
  });

  const { data: questions, isLoading: isQuestionsLoading, refetch: refetchQuestions } = useQuery({
    queryKey: ['draft-questions', sessionId],
    queryFn: () => fetchDraftQuestions(sessionId),
    enabled: !!sessionId && !!user,
  });

  const checkHostStatus = useCallback(async () => {
    if (!user || !sessionId) return;
    const hostStatus = await checkIsHost(sessionId, user.id);
    setIsHost(hostStatus);
  }, [user, sessionId]);

  const handleJoinSession = async () => {
    if (!user || !sessionId) return;
    
    try {
      await joinSession(sessionId);
      setJoinModalOpen(false);
      await refetchParticipants();
      await checkHostStatus();
      toast.success('Joined session successfully');
      
      if (user) {
        trackUserPresence();
      }
    } catch (error) {
      console.error('Error joining session:', error);
      toast.error('Failed to join session');
    }
  };

  const trackUserPresence = useCallback(() => {
    if (!user || !sessionId) return;
    
    const handleUserActivity = () => {
      const channel = supabase.channel(`room_${sessionId}`);
      
      channel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: user.id,
            online_at: new Date().toISOString(),
          });
        }
      });
      
      return () => {
        supabase.removeChannel(channel);
      };
    };
    
    const cleanup = handleUserActivity();
    
    const interval = setInterval(() => {
      handleUserActivity();
    }, 30000);
    
    return () => {
      cleanup();
      clearInterval(interval);
    };
  }, [user, sessionId]);

  useEffect(() => {
    if (!user || !sessionId) return;

    const unsubscribe = subscribeToSessionUpdates(
      sessionId,
      (newParticipant) => {
        console.log('Participant joined:', newParticipant);
        refetchParticipants();
        
        setSessionActivities(prev => [
          { 
            type: 'join', 
            userId: newParticipant.user_id, 
            timestamp: new Date().toISOString(),
            message: 'joined the session' 
          },
          ...prev
        ]);
      },
      (leftParticipant) => {
        console.log('Participant left:', leftParticipant);
        refetchParticipants();
        
        setSessionActivities(prev => [
          { 
            type: 'leave', 
            userId: leftParticipant.user_id, 
            timestamp: new Date().toISOString(),
            message: 'left the session' 
          },
          ...prev
        ]);
      },
      (newQuestion) => {
        console.log('Question created:', newQuestion);
        queryClient.setQueryData(['draft-questions', sessionId], (oldData: DraftQuestion[] | undefined) => {
          if (!oldData) return [newQuestion];
          
          const exists = oldData.some(q => q.id === newQuestion.id);
          if (exists) return oldData;
          
          return [newQuestion, ...oldData];
        });
        
        setSessionActivities(prev => [
          { 
            type: 'create', 
            userId: newQuestion.creator_id, 
            questionId: newQuestion.id,
            timestamp: new Date().toISOString(),
            message: 'created a new question' 
          },
          ...prev
        ]);
      },
      (updatedQuestion) => {
        console.log('Question updated:', updatedQuestion);
        queryClient.setQueryData(['draft-questions', sessionId], (oldData: DraftQuestion[] | undefined) => {
          return oldData ? oldData.map(q => q.id === updatedQuestion.id ? updatedQuestion : q) : [updatedQuestion];
        });
        
        setSessionActivities(prev => [
          { 
            type: 'update', 
            userId: updatedQuestion.creator_id, 
            questionId: updatedQuestion.id,
            timestamp: new Date().toISOString(),
            message: `updated question #${updatedQuestion.id.slice(-4)}` 
          },
          ...prev
        ]);
        
        const oldQuestion = questions?.find(q => q.id === updatedQuestion.id);
        if (oldQuestion?.status !== 'reviewed' && updatedQuestion.status === 'reviewed') {
          setSessionActivities(prev => [
            { 
              type: 'review', 
              userId: updatedQuestion.creator_id, 
              questionId: updatedQuestion.id,
              timestamp: new Date().toISOString(),
              message: `marked question #${updatedQuestion.id.slice(-4)} as reviewed` 
            },
            ...prev
          ]);
        }
      },
      (deletedQuestion) => {
        console.log('Question deleted:', deletedQuestion);
        queryClient.setQueryData(['draft-questions', sessionId], (oldData: DraftQuestion[] | undefined) => {
          return oldData ? oldData.filter(q => q.id !== deletedQuestion.id) : [];
        });
        
        setSessionActivities(prev => [
          { 
            type: 'delete', 
            userId: deletedQuestion.creator_id, 
            questionId: deletedQuestion.id,
            timestamp: new Date().toISOString(),
            message: `deleted question #${deletedQuestion.id.slice(-4)}` 
          },
          ...prev
        ]);
      }
    );

    const presenceChannel = supabase.channel(`room_${sessionId}`);
    
    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        console.log('Current presence state:', state);
        
        const formattedActiveUsers = Object.entries(state).reduce((acc, [key, values]: [string, any[]]) => {
          if (values && values.length > 0) {
            const userId = values[0].user_id;
            if (userId) {
              acc[userId] = {
                online_at: values[0].online_at,
                presence_ref: key
              };
            }
          }
          return acc;
        }, {} as Record<string, { online_at: string, presence_ref: string }>);
        
        setPresenceState(formattedActiveUsers);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User joined:', key, newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User left:', key, leftPresences);
      })
      .subscribe();

    const checkParticipation = async () => {
      const sessionParticipants = await fetchSessionParticipants(sessionId);
      const isParticipant = sessionParticipants.some(p => p.user_id === user.id);
      if (isParticipant) {
        setJoinModalOpen(false);
        await checkHostStatus();
        
        trackUserPresence();
      }
    };
    
    checkParticipation();

    return () => {
      unsubscribe();
      supabase.removeChannel(presenceChannel);
    };
  }, [sessionId, user, queryClient, refetchParticipants, checkHostStatus, trackUserPresence, questions]);

  const handleEditQuestion = (question: DraftQuestion) => {
    setSelectedQuestion(question);
    setIsEditModalOpen(true);
  };

  const handleQuestionUpdated = (updatedQuestion: DraftQuestion) => {
    queryClient.setQueryData(['draft-questions', sessionId], (oldData: DraftQuestion[] | undefined) => {
      return oldData ? oldData.map(q => q.id === updatedQuestion.id ? updatedQuestion : q) : [updatedQuestion];
    });
  };

  const handleDeleteConfirm = (questionId: string) => {
    setQuestionToDelete(questionId);
    setIsDeleteAlertOpen(true);
  };

  const handleDeleteQuestion = async () => {
    if (!questionToDelete) return;
    
    try {
      await deleteDraftQuestion(questionToDelete);
      toast.success('Question deleted successfully');
      queryClient.setQueryData(['draft-questions', sessionId], (oldData: DraftQuestion[] | undefined) => {
        return oldData ? oldData.filter(q => q.id !== questionToDelete) : [];
      });
    } catch (error) {
      console.error('Error deleting question:', error);
      toast.error('Failed to delete question');
    } finally {
      setIsDeleteAlertOpen(false);
      setQuestionToDelete(null);
    }
  };

  const handleCloseSession = async () => {
    if (!sessionId) return;
    
    try {
      await closeExamSession(sessionId);
      toast.success('Session closed successfully');
      queryClient.invalidateQueries({ queryKey: ['exam-session', sessionId] });
      setIsCloseSessionDialogOpen(false);
    } catch (error) {
      console.error('Error closing session:', error);
      toast.error('Failed to close session');
    }
  };

  const handleShareSession = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      toast.success('Session link copied to clipboard');
    });
  };

  if (isSessionLoading || isParticipantsLoading || isQuestionsLoading) {
    return (
      <div className="container mx-auto px-4 py-6 flex justify-center items-center h-[50vh]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading session...</p>
        </div>
      </div>
    );
  }

  if (sessionError || !session) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="text-center">
          <AlertTriangle className="h-8 w-8 mx-auto mb-4 text-yellow-500" />
          <h2 className="text-xl font-semibold mb-2">Session Not Found</h2>
          <p className="mb-4">The session you're looking for doesn't exist or you don't have access to it.</p>
          <Button onClick={() => navigate('/collab')}>Back to Sessions</Button>
        </div>
      </div>
    );
  }

  const sortedQuestions = [...(questions || [])].sort((a, b) => {
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const questionsCount = sortedQuestions.length;
  const publishableQuestions = sortedQuestions.filter(q => q.status === 'reviewed');
  const draftQuestions = sortedQuestions.filter(q => q.status === 'draft');

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <Dialog open={joinModalOpen && !isSessionLoading && session.is_active} onOpenChange={setJoinModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Join Collaborative Session</DialogTitle>
            <DialogDescription>
              You're about to join "{session.title}". You'll be able to see and add questions collaboratively.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => navigate('/collab')} variant="outline">
              Cancel
            </Button>
            <Button onClick={handleJoinSession}>
              Join Session
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => navigate('/collab')} className="p-2">
              Back
            </Button>
            <h1 className="text-2xl font-bold">{session.title}</h1>
            {!session.is_active && (
              <Badge variant="outline" className="ml-2">Closed</Badge>
            )}
          </div>
          <p className="text-muted-foreground ml-10">
            {session.subject}
            {session.semester && session.year ? ` - ${session.semester} ${session.year}` : ''}
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleShareSession}
            className="flex items-center"
          >
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
          
          {isHost && session.is_active && (
            <Button 
              variant="outline" 
              onClick={() => setIsCloseSessionDialogOpen(true)}
              className="flex items-center text-yellow-600"
            >
              Close Session
            </Button>
          )}
          
          {publishableQuestions.length > 0 && (
            <Button 
              onClick={() => setIsPublishModalOpen(true)}
              className="flex items-center"
            >
              <Check className="h-4 w-4 mr-2" />
              Publish Questions ({publishableQuestions.length})
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Session Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {session.description && (
                <p className="text-sm">{session.description}</p>
              )}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium">Status</p>
                  <p>{session.is_active ? 'Active' : 'Closed'}</p>
                </div>
                <div>
                  <p className="font-medium">Questions</p>
                  <p>{questionsCount} total ({publishableQuestions.length} ready)</p>
                </div>
                {session.semester && (
                  <div>
                    <p className="font-medium">Semester</p>
                    <p>{session.semester}</p>
                  </div>
                )}
                {session.year && (
                  <div>
                    <p className="font-medium">Year</p>
                    <p>{session.year}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <ParticipantsList 
            participants={participants || []} 
            sessionId={sessionId}
          />

          <SessionActivityFeed 
            sessionId={sessionId}
          />

          {session.is_active && (
            <div id="add-question-section">
              <AddQuestionForm 
                sessionId={sessionId} 
                onQuestionAdded={() => refetchQuestions()}
              />
            </div>
          )}
        </div>

        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-0">
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center">
                  Questions 
                  <Badge variant="outline" className="ml-2">
                    {questionsCount}
                  </Badge>
                  {draftQuestions.length > 0 && (
                    <Badge variant="outline" className="ml-2 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
                      {draftQuestions.length} drafts
                    </Badge>
                  )}
                  {publishableQuestions.length > 0 && (
                    <Badge variant="outline" className="ml-2 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                      {publishableQuestions.length} reviewed
                    </Badge>
                  )}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              {questionsCount === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground mb-4">No questions added yet</p>
                  {session.is_active && (
                    <Button onClick={() => document.getElementById('add-question-section')?.scrollIntoView({ behavior: 'smooth' })}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Question
                    </Button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {sortedQuestions.map((question) => (
                    <QuestionCard
                      key={question.id}
                      question={question}
                      onEditClick={handleEditQuestion}
                      onDeleteClick={handleDeleteConfirm}
                      isHost={isHost}
                      activeUsers={questionCardActiveUsers}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <EditQuestionForm
        question={selectedQuestion}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onQuestionUpdated={handleQuestionUpdated}
      />

      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this question. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteQuestion}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isCloseSessionDialogOpen} onOpenChange={setIsCloseSessionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Close Session</DialogTitle>
            <DialogDescription>
              Are you sure you want to close this session? Once closed, no new questions can be added.
              {publishableQuestions.length > 0 && (
                <p className="mt-2 text-yellow-600">
                  There are {publishableQuestions.length} reviewed questions ready to publish. Consider publishing them before closing.
                </p>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCloseSessionDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="default" onClick={handleCloseSession}>
              Close Session
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <PublishModal
        isOpen={isPublishModalOpen}
        onClose={() => setIsPublishModalOpen(false)}
        sessionId={sessionId}
        questions={publishableQuestions}
        sessionTitle={session.title}
      />
    </div>
  );
};

export default SessionDetails;

