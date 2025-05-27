
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Play, RefreshCw, Search, Filter } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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

  const triggerProcessing = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('process-ai-commentary');
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success(`Processing triggered: ${data.processed} questions processed`);
      queryClient.invalidateQueries({ queryKey: ['ai-commentary-queue'] });
      queryClient.invalidateQueries({ queryKey: ['ai-commentary-stats'] });
    },
    onError: (error) => {
      toast.error('Failed to trigger processing: ' + error.message);
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
      toast.success('Questions queued for processing');
      refetch();
    },
    onError: (error) => {
      toast.error('Failed to queue questions: ' + error.message);
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

  return (
    <div className="space-y-6">
      {/* Queue Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Queue Management</span>
            <div className="flex gap-2">
              <Badge variant="outline">{pendingCount} pending</Badge>
              <Badge variant="outline">{processingCount} processing</Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button 
              onClick={() => triggerProcessing.mutate()}
              disabled={triggerProcessing.isPending}
              className="flex items-center gap-2"
            >
              <Play className="h-4 w-4" />
              {triggerProcessing.isPending ? 'Triggering...' : 'Trigger Processing'}
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => refetch()}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search Questions</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by question, subject, or filename..."
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
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Queue List */}
      <Card>
        <CardHeader>
          <CardTitle>Processing Queue ({queueData?.length || 0} questions)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {queueData?.length ? (
              queueData.map((question) => (
                <div key={question.id} className="border rounded-lg p-4 space-y-2">
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
                        {question.ai_commentary_status}
                      </Badge>
                      {question.ai_commentary_status === 'failed' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleQueueSelected(question.id)}
                          disabled={queueSpecificQuestions.isPending}
                        >
                          Retry
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-xs text-muted-foreground space-y-1">
                    {question.ai_commentary_queued_at && (
                      <p>Queued: {new Date(question.ai_commentary_queued_at).toLocaleString()}</p>
                    )}
                    {question.ai_commentary_processed_at && (
                      <p>Processed: {new Date(question.ai_commentary_processed_at).toLocaleString()}</p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No questions in queue</p>
                {statusFilter !== 'all' && (
                  <Button 
                    variant="link" 
                    onClick={() => setStatusFilter('all')}
                    className="mt-2"
                  >
                    View all questions
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
