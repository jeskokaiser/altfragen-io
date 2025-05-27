
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { DraftQuestion } from '@/types/ExamSession';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { useSessionData } from '@/hooks/useSessionData';
import QuickQuestionForm from './QuickQuestionForm';
import { Users, Share2, CheckCircle, X, ArrowLeft, AlertCircle, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

const LiveSessionView: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { isReady, isAuthenticated, userId } = useAuthGuard();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const {
    session,
    participants,
    questions,
    isParticipant,
    isHost,
    isLoading,
    error,
    actions
  } = useSessionData(sessionId, userId);

  // Redirect to auth if not authenticated
  useEffect(() => {
    if (isReady && !isAuthenticated) {
      navigate('/auth');
    }
  }, [isReady, isAuthenticated, navigate]);

  // Load session data when auth is ready
  useEffect(() => {
    if (isAuthenticated && sessionId && userId) {
      actions.loadData();
    }
  }, [isAuthenticated, sessionId, userId]);

  const handleJoinSession = async () => {
    const success = await actions.joinSession();
    if (success) {
      toast.success('Successfully joined the session!');
    }
  };

  const handleAddQuestion = async (questionData: any) => {
    setIsSubmitting(true);
    try {
      await actions.addQuestion(questionData);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReviewQuestion = async (questionId: string) => {
    await actions.updateQuestionStatus(questionId, 'reviewed');
  };

  const handlePublishQuestions = async () => {
    await actions.publishQuestions(null);
  };

  const handleCloseSession = async () => {
    const success = await actions.closeSession();
    if (success) {
      navigate('/collab');
    }
  };

  const handleShareSession = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Session link copied to clipboard');
  };

  const handleRetry = () => {
    actions.loadData();
  };

  // Show loading state while auth is not ready
  if (!isReady || isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center space-x-2 mb-6">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-4 w-full" />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Cannot Access Session</h2>
              <p className="text-muted-foreground mb-4">{error}</p>
              <div className="flex justify-center space-x-2">
                <Button onClick={handleRetry} variant="outline">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
                <Button onClick={() => navigate('/collab')}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Sessions
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show session not found
  if (!session) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Session Not Found</h2>
              <p className="text-muted-foreground mb-4">
                This session may have been deleted or you don't have access to it.
              </p>
              <Button onClick={() => navigate('/collab')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Sessions
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show join session view if not joined
  if (!isParticipant) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Join Collaboration Session</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-xl font-semibold">{session.title}</h3>
              <p className="text-muted-foreground">{session.subject}</p>
              {session.description && (
                <p className="mt-2 text-sm">{session.description}</p>
              )}
            </div>
            
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => navigate('/collab')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button onClick={handleJoinSession}>
                Join Session
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const reviewedQuestions = questions.filter(q => q.status === 'reviewed');
  const draftQuestions = questions.filter(q => q.status === 'draft');

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" onClick={() => navigate('/collab')}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h1 className="text-2xl font-bold">{session.title}</h1>
            {!session.is_active && (
              <Badge variant="secondary">Closed</Badge>
            )}
          </div>
          <p className="text-muted-foreground ml-10">
            {session.subject} • {participants.length} participants • {questions.length} questions
          </p>
        </div>
        
        <div className="flex space-x-2">
          <Button variant="outline" onClick={handleShareSession}>
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
          
          {reviewedQuestions.length > 0 && (
            <Button onClick={handlePublishQuestions}>
              <CheckCircle className="w-4 h-4 mr-2" />
              Publish ({reviewedQuestions.length})
            </Button>
          )}
          
          {isHost && session.is_active && (
            <Button variant="destructive" onClick={handleCloseSession}>
              <X className="w-4 h-4 mr-2" />
              Close Session
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left sidebar */}
        <div className="space-y-6">
          {/* Participants */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Participants ({participants.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {participants.length === 0 ? (
                <p className="text-sm text-muted-foreground">Loading participants...</p>
              ) : (
                participants.map((participant) => (
                  <div key={participant.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Avatar className="w-6 h-6">
                        <AvatarFallback className="text-xs">
                          {participant.user_id.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{participant.user_id.slice(0, 8)}...</span>
                    </div>
                    {participant.role === 'host' && (
                      <Badge variant="outline" className="text-xs">Host</Badge>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Add Question Form */}
          {session.is_active && (
            <QuickQuestionForm 
              onSubmit={handleAddQuestion}
              isSubmitting={isSubmitting}
            />
          )}
        </div>

        {/* Main content - Questions */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>
                Questions ({questions.length})
                {draftQuestions.length > 0 && (
                  <Badge variant="outline" className="ml-2">
                    {draftQuestions.length} drafts
                  </Badge>
                )}
                {reviewedQuestions.length > 0 && (
                  <Badge variant="default" className="ml-2">
                    {reviewedQuestions.length} reviewed
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {questions.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No questions yet. Add the first one!
                </div>
              ) : (
                <div className="space-y-4">
                  {questions.map((question) => (
                    <Card key={question.id} className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium">
                            Question #{question.id.slice(-4)}
                          </span>
                          <Badge variant={question.status === 'reviewed' ? 'default' : 'outline'}>
                            {question.status}
                          </Badge>
                          <Badge variant="outline">
                            Difficulty: {question.difficulty}
                          </Badge>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(question.created_at), 'HH:mm')}
                        </span>
                      </div>
                      
                      <h4 className="font-medium mb-3">{question.question}</h4>
                      
                      <div className="grid grid-cols-1 gap-2 text-sm mb-3">
                        {['A', 'B', 'C', 'D', 'E'].map((letter) => (
                          <div 
                            key={letter}
                            className={`p-2 rounded ${
                              question.correct_answer === letter 
                                ? 'bg-green-100 dark:bg-green-900/30' 
                                : 'bg-gray-50 dark:bg-gray-800'
                            }`}
                          >
                            {letter}: {question[`option_${letter.toLowerCase()}` as keyof DraftQuestion] as string}
                          </div>
                        ))}
                      </div>
                      
                      {question.comment && (
                        <p className="text-sm text-muted-foreground mb-3">
                          Comment: {question.comment}
                        </p>
                      )}
                      
                      {isHost && question.status === 'draft' && (
                        <Button 
                          size="sm" 
                          onClick={() => handleReviewQuestion(question.id)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Mark as Reviewed
                        </Button>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LiveSessionView;
