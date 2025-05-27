
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Search, RefreshCw, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const AICommentaryLogs: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data: logs, isLoading, refetch } = useQuery({
    queryKey: ['ai-commentary-logs', searchQuery, statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('ai_answer_comments')
        .select(`
          *,
          questions!inner(
            question,
            subject,
            filename
          )
        `)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('processing_status', statusFilter);
      }

      if (searchQuery) {
        // Search in question text, subject, or filename
        query = query.or(`questions.question.ilike.%${searchQuery}%, questions.subject.ilike.%${searchQuery}%, questions.filename.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query.limit(100);
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // Get summary logs as well
  const { data: summaryLogs, isLoading: summaryLoading } = useQuery({
    queryKey: ['ai-commentary-summary-logs', searchQuery],
    queryFn: async () => {
      let query = supabase
        .from('ai_commentary_summaries')
        .select(`
          *,
          questions!inner(
            question,
            subject,
            filename
          )
        `)
        .order('created_at', { ascending: false });

      if (searchQuery) {
        query = query.or(`questions.question.ilike.%${searchQuery}%, questions.subject.ilike.%${searchQuery}%, questions.filename.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query.limit(50);
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 30000
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'processing':
        return <Clock className="h-4 w-4 text-blue-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading || summaryLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const allLogs = logs || [];
  const allSummaries = summaryLogs || [];
  const errorLogs = allLogs.filter(log => log.processing_status === 'failed');
  const successLogs = allLogs.filter(log => log.processing_status === 'completed');

  return (
    <div className="space-y-6">
      {/* Log Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Answer Comments</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{allLogs.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Summaries</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{allSummaries.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Errors</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{errorLogs.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            AI Commentary Logs
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => refetch()}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search logs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Answer Comments Logs */}
      <Card>
        <CardHeader>
          <CardTitle>Answer Comments ({allLogs.length} entries)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {allLogs.length ? (
              allLogs.map((log) => (
                <div key={log.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        {getStatusIcon(log.processing_status || 'unknown')}
                        <Badge className={getStatusColor(log.processing_status || 'unknown')}>
                          {log.processing_status || 'unknown'}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {new Date(log.created_at || '').toLocaleString()}
                        </span>
                      </div>
                      <p className="font-medium text-sm mb-1">
                        Question: {log.questions?.question?.substring(0, 100)}...
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>Subject: {log.questions?.subject}</span>
                        <span>•</span>
                        <span>File: {log.questions?.filename}</span>
                      </div>
                    </div>
                  </div>

                  {(log.openai_general_comment || log.claude_general_comment || log.gemini_general_comment) && (
                    <div className="mt-3 p-3 bg-gray-50 rounded text-sm">
                      <strong>Available Comments:</strong>
                      <div className="mt-1 space-y-1">
                        {log.openai_general_comment && <p>• OpenAI: General comment available</p>}
                        {log.claude_general_comment && <p>• Claude: General comment available</p>}
                        {log.gemini_general_comment && <p>• Gemini: General comment available</p>}
                      </div>
                    </div>
                  )}

                  {log.processing_status === 'failed' && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded text-sm">
                      <strong className="text-red-800">Processing Failed</strong>
                      <p className="mt-1 text-red-700">Check the processing logs for more details.</p>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No answer comments found</p>
                {(searchQuery || statusFilter !== 'all') && (
                  <Button 
                    variant="link" 
                    onClick={() => {
                      setSearchQuery('');
                      setStatusFilter('all');
                    }}
                    className="mt-2"
                  >
                    Clear filters
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Summary Logs */}
      <Card>
        <CardHeader>
          <CardTitle>Commentary Summaries ({allSummaries.length} entries)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {allSummaries.length ? (
              allSummaries.map((summary) => (
                <div key={summary.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <Badge className="bg-green-100 text-green-800">
                          Summary Available
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {new Date(summary.created_at || '').toLocaleString()}
                        </span>
                      </div>
                      <p className="font-medium text-sm mb-1">
                        Question: {summary.questions?.question?.substring(0, 100)}...
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>Subject: {summary.questions?.subject}</span>
                        <span>•</span>
                        <span>File: {summary.questions?.filename}</span>
                      </div>
                    </div>
                  </div>

                  {summary.summary_general_comment && (
                    <div className="mt-3 p-3 bg-blue-50 rounded text-sm">
                      <strong>General Summary:</strong>
                      <p className="mt-1 line-clamp-3">{summary.summary_general_comment}</p>
                    </div>
                  )}

                  {summary.model_agreement_analysis && (
                    <div className="mt-3 p-3 bg-purple-50 rounded text-sm">
                      <strong>Model Agreement Analysis:</strong>
                      <p className="mt-1 line-clamp-3">{summary.model_agreement_analysis}</p>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No summaries found</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AICommentaryLogs;
