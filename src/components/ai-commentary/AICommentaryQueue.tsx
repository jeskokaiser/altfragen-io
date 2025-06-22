
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Play, RefreshCw, Search, Brain, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AIAnswerCommentaryService } from '@/services/AIAnswerCommentaryService';

const AICommentaryQueue: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const queryClient = useQueryClient();

  const { data: queueData, isLoading, refetch } = useQuery({
    queryKey: ['ai-commentary-queue', searchQuery, statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('questions')
        .select(`
          id,
          question,
          subject,
          filename,
          ai_commentary_status,
          ai_commentary_queued_at,
          ai_commentary_processed_at,
          created_at
        `)
        .not('ai_commentary_status', 'is', null)
        .order('ai_commentary_queued_at', { ascending: true });

      if (statusFilter !== 'all') {
        query = query.eq('ai_commentary_status', statusFilter);
      }

      if (searchQuery) {
        query = query.or(`question.ilike.%${searchQuery}%, subject.ilike.%${searchQuery}%, filename.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query.limit(100);
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 10000 // Refresh every 10 seconds
  });

  const { data: stats } = useQuery({
    queryKey: ['ai-commentary-enhanced-stats'],
    queryFn: () => AIAnswerCommentaryService.getProcessingStats(),
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  const triggerProcessing = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('process-ai-commentary');
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success(`Verarbeitung gestartet: ${data?.processed || 0} Fragen verarbeitet`);
      queryClient.invalidateQueries({ queryKey: ['ai-commentary-queue'] });
      queryClient.invalidateQueries({ queryKey: ['ai-commentary-enhanced-stats'] });
    },
    onError: (error: any) => {
      toast.error('Fehler beim Starten der Verarbeitung: ' + error.message);
    }
  });

  const queueSpecificQuestions = useMutation({
    mutationFn: async (questionIds: string[]) => {
      const { error } = await supabase
        .from('questions')
        .update({
          ai_commentary_status: 'pending',
          ai_commentary_queued_at: new Date().toISOString()
        })
        .in('id', questionIds);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Fragen für Verarbeitung eingeplant');
      refetch();
    },
    onError: (error: any) => {
      toast.error('Fehler beim Einplanen der Fragen: ' + error.message);
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-3 w-3" />;
      case 'processing': return <RefreshCw className="h-3 w-3 animate-spin" />;
      case 'completed': return <CheckCircle className="h-3 w-3" />;
      case 'failed': return <AlertCircle className="h-3 w-3" />;
      default: return <Brain className="h-3 w-3" />;
    }
  };

  const handleQueueSelected = (questionId: string) => {
    queueSpecificQuestions.mutate([questionId]);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const pendingCount = queueData?.filter(q => q.ai_commentary_status === 'pending').length || 0;
  const processingCount = queueData?.filter(q => q.ai_commentary_status === 'processing').length || 0;
  const completedCount = queueData?.filter(q => q.ai_commentary_status === 'completed').length || 0;

  return (
    <div className="space-y-6">
      {/* Enhanced Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">Gesamte Fragen</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
              <p className="text-xs text-muted-foreground">Warteschlange</p>
              {stats.total > 0 && (
                <Progress value={(stats.pending / stats.total) * 100} className="mt-2" />
              )}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-600">{stats.withComments}</div>
              <p className="text-xs text-muted-foreground">Mit KI-Kommentaren</p>
              {stats.total > 0 && (
                <Progress value={(stats.withComments / stats.total) * 100} className="mt-2" />
              )}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-blue-600">{stats.processed}</div>
              <p className="text-xs text-muted-foreground">Verarbeitet</p>
              {stats.total > 0 && (
                <Progress value={(stats.processed / stats.total) * 100} className="mt-2" />
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Queue Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              KI-Verarbeitungsqueue
            </span>
            <div className="flex gap-2">
              <Badge variant="outline" className="bg-yellow-50">
                <Clock className="h-3 w-3 mr-1" />
                {pendingCount} wartend
              </Badge>
              <Badge variant="outline" className="bg-blue-50">
                <RefreshCw className="h-3 w-3 mr-1" />
                {processingCount} wird verarbeitet
              </Badge>
              <Badge variant="outline" className="bg-green-50">
                <CheckCircle className="h-3 w-3 mr-1" />
                {completedCount} abgeschlossen
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button 
              onClick={() => triggerProcessing.mutate()}
              disabled={triggerProcessing.isPending || pendingCount === 0}
              className="flex items-center gap-2"
            >
              {triggerProcessing.isPending ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              {triggerProcessing.isPending ? 'Wird gestartet...' : 'Verarbeitung starten'}
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => refetch()}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Aktualisieren
            </Button>
          </div>

          {pendingCount === 0 && (
            <Alert>
              <Brain className="h-4 w-4" />
              <AlertDescription>
                Keine Fragen in der Warteschlange. Fragen werden automatisch zur Verarbeitung eingeplant oder können manuell hinzugefügt werden.
              </AlertDescription>
            </Alert>
          )}

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Fragen durchsuchen</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Nach Frage, Fach oder Dateiname suchen..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Status Filter</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Status</SelectItem>
                  <SelectItem value="pending">Wartend</SelectItem>
                  <SelectItem value="processing">Wird verarbeitet</SelectItem>
                  <SelectItem value="completed">Abgeschlossen</SelectItem>
                  <SelectItem value="failed">Fehlgeschlagen</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Queue List */}
      <Card>
        <CardHeader>
          <CardTitle>Verarbeitungsqueue ({queueData?.length || 0} Fragen)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {queueData?.length ? (
              queueData.map((question) => (
                <div key={question.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{question.question}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline">{question.subject}</Badge>
                        <span className="text-sm text-muted-foreground">{question.filename}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Badge className={getStatusColor(question.ai_commentary_status)}>
                        {getStatusIcon(question.ai_commentary_status)}
                        <span className="ml-1 capitalize">{question.ai_commentary_status}</span>
                      </Badge>
                      {question.ai_commentary_status === 'failed' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleQueueSelected(question.id)}
                          disabled={queueSpecificQuestions.isPending}
                        >
                          Erneut versuchen
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-xs text-muted-foreground space-y-1">
                    {question.ai_commentary_queued_at && (
                      <p>Eingeplant: {new Date(question.ai_commentary_queued_at).toLocaleString('de-DE')}</p>
                    )}
                    {question.ai_commentary_processed_at && (
                      <p>Verarbeitet: {new Date(question.ai_commentary_processed_at).toLocaleString('de-DE')}</p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Brain className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-muted-foreground">Keine Fragen in der Queue gefunden</p>
                {statusFilter !== 'all' && (
                  <Button 
                    variant="link" 
                    onClick={() => setStatusFilter('all')}
                    className="mt-2"
                  >
                    Alle Fragen anzeigen
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AICommentaryQueue;
