
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { Clock, CheckCircle, AlertTriangle, XCircle, RefreshCw } from 'lucide-react';

const CronJobMonitor: React.FC = () => {
  const { data: cronLogs, isLoading } = useQuery({
    queryKey: ['ai-commentary-cron-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_commentary_cron_logs')
        .select('*')
        .order('executed_at', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'completed_with_errors':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'running':
        return <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />;
      case 'skipped':
        return <Clock className="h-4 w-4 text-gray-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'completed_with_errors': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'running': return 'bg-blue-100 text-blue-800';
      case 'skipped': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cron Job Monitor</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const recentLogs = cronLogs || [];
  const completedRuns = recentLogs.filter(log => log.status === 'completed').length;
  const failedRuns = recentLogs.filter(log => log.status === 'failed').length;
  const averageProcessed = recentLogs.length > 0 
    ? Math.round(recentLogs.reduce((sum, log) => sum + (log.questions_processed || 0), 0) / recentLogs.length)
    : 0;
  const averageTime = recentLogs.length > 0
    ? Math.round(recentLogs.reduce((sum, log) => sum + (log.execution_time_ms || 0), 0) / recentLogs.length)
    : 0;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Runs</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recentLogs.length}</div>
            <p className="text-xs text-muted-foreground">Last 20 executions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {recentLogs.length > 0 ? Math.round((completedRuns / recentLogs.length) * 100) : 0}%
            </div>
            <Progress 
              value={recentLogs.length > 0 ? (completedRuns / recentLogs.length) * 100 : 0} 
              className="mt-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Processed</CardTitle>
            <RefreshCw className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{averageProcessed}</div>
            <p className="text-xs text-muted-foreground">Questions per run</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Time</CardTitle>
            <Clock className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {averageTime < 1000 ? `${averageTime}ms` : `${Math.round(averageTime / 1000)}s`}
            </div>
            <p className="text-xs text-muted-foreground">Execution time</p>
          </CardContent>
        </Card>
      </div>

      {/* Execution History */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Cron Job Executions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentLogs.length ? (
              recentLogs.map((log) => (
                <div key={log.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(log.status)}
                      <Badge className={getStatusColor(log.status)}>
                        {log.status.replace('_', ' ')}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {new Date(log.executed_at).toLocaleString('de-DE')}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        {log.questions_processed || 0} processed
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {log.execution_time_ms 
                          ? log.execution_time_ms < 1000 
                            ? `${log.execution_time_ms}ms`
                            : `${Math.round(log.execution_time_ms / 1000)}s`
                          : 'N/A'
                        }
                      </div>
                    </div>
                  </div>
                  
                  {log.error_message && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm">
                      <strong className="text-red-800">Error:</strong>
                      <p className="mt-1 text-red-700">{log.error_message}</p>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Clock className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-muted-foreground">No cron job executions found</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Cron jobs run every 5 minutes automatically
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CronJobMonitor;
