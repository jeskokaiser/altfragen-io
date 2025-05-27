
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Activity, CheckCircle, Clock, XCircle, Users, Zap } from 'lucide-react';

const AICommentaryStats: React.FC = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['ai-commentary-stats'],
    queryFn: async () => {
      // Get question status counts
      const { data: questionStats } = await supabase
        .from('questions')
        .select('ai_commentary_status')
        .not('ai_commentary_status', 'is', null);

      // Get recent processing activity
      const { data: recentActivity } = await supabase
        .from('ai_commentaries')
        .select('created_at, processing_status, model_name')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false });

      // Get commentary counts by model
      const { data: modelStats } = await supabase
        .from('ai_commentaries')
        .select('model_name, processing_status')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      // Process the data
      const statusCounts = questionStats?.reduce((acc, q) => {
        acc[q.ai_commentary_status] = (acc[q.ai_commentary_status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const modelCounts = modelStats?.reduce((acc, c) => {
        if (!acc[c.model_name]) acc[c.model_name] = { total: 0, successful: 0 };
        acc[c.model_name].total++;
        if (c.processing_status === 'completed') acc[c.model_name].successful++;
        return acc;
      }, {} as Record<string, { total: number; successful: number }>) || {};

      return {
        statusCounts,
        recentActivity: recentActivity || [],
        modelCounts,
        totalProcessed: statusCounts.completed || 0,
        totalPending: statusCounts.pending || 0,
        totalFailed: statusCounts.failed || 0,
        totalProcessing: statusCounts.processing || 0
      };
    },
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="animate-pulse space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const totalQuestions = (stats?.totalProcessed || 0) + (stats?.totalPending || 0) + 
                        (stats?.totalFailed || 0) + (stats?.totalProcessing || 0);
  const successRate = totalQuestions > 0 ? ((stats?.totalProcessed || 0) / totalQuestions) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Main Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalPending || 0}</div>
            <p className="text-xs text-muted-foreground">
              Questions awaiting processing
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processing</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalProcessing || 0}</div>
            <p className="text-xs text-muted-foreground">
              Currently being processed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalProcessed || 0}</div>
            <p className="text-xs text-muted-foreground">
              Successfully processed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalFailed || 0}</div>
            <p className="text-xs text-muted-foreground">
              Processing failures
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Success Rate */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Processing Success Rate
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span>Overall Success Rate</span>
              <span>{successRate.toFixed(1)}%</span>
            </div>
            <Progress value={successRate} className="w-full" />
            <p className="text-xs text-muted-foreground">
              Based on {totalQuestions} total questions processed
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Model Performance */}
      <Card>
        <CardHeader>
          <CardTitle>AI Model Performance (Last 7 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(stats?.modelCounts || {}).map(([model, data]) => {
              const modelSuccessRate = data.total > 0 ? (data.successful / data.total) * 100 : 0;
              return (
                <div key={model} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{model}</Badge>
                      <span className="text-sm text-muted-foreground">
                        {data.successful}/{data.total} successful
                      </span>
                    </div>
                    <span className="text-sm font-medium">{modelSuccessRate.toFixed(1)}%</span>
                  </div>
                  <Progress value={modelSuccessRate} className="h-2" />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity (Last 24 Hours)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {stats?.recentActivity.length ? (
              stats.recentActivity.slice(0, 10).map((activity, index) => (
                <div key={index} className="flex justify-between items-center py-2 border-b last:border-b-0">
                  <div className="flex items-center gap-2">
                    <Badge variant={activity.processing_status === 'completed' ? 'default' : 'destructive'}>
                      {activity.model_name}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {activity.processing_status}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(activity.created_at).toLocaleTimeString()}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No recent activity</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AICommentaryStats;
