
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, TrendingUp, Clock, CheckCircle } from 'lucide-react';

const CommentaryStats = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['commentary-stats'],
    queryFn: async () => {
      // Get total commentaries by model
      const { data: commentariesByModel } = await supabase
        .from('ai_commentaries')
        .select('model_name')
        .eq('processing_status', 'completed');

      // Get processing status distribution
      const { data: statusDistribution } = await supabase
        .from('questions')
        .select('ai_commentary_status');

      // Get recent activity (last 7 days)
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data: recentActivity } = await supabase
        .from('ai_commentaries')
        .select('created_at')
        .gte('created_at', weekAgo);

      // Get summaries count
      const { data: summaries } = await supabase
        .from('ai_commentary_summaries')
        .select('id', { count: 'exact' });

      // Process data
      const modelCounts = commentariesByModel?.reduce((acc: any, item) => {
        acc[item.model_name] = (acc[item.model_name] || 0) + 1;
        return acc;
      }, {}) || {};

      const statusCounts = statusDistribution?.reduce((acc: any, item) => {
        acc[item.ai_commentary_status] = (acc[item.ai_commentary_status] || 0) + 1;
        return acc;
      }, {}) || {};

      return {
        modelCounts,
        statusCounts,
        recentActivity: recentActivity?.length || 0,
        totalSummaries: summaries?.length || 0,
        totalCommentaries: commentariesByModel?.length || 0
      };
    },
    refetchInterval: 60000 // Refresh every minute
  });

  if (isLoading) {
    return <div>Loading statistics...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <BarChart3 className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total Commentaries</p>
                <p className="text-2xl font-bold">{stats?.totalCommentaries || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Summaries Generated</p>
                <p className="text-2xl font-bold">{stats?.totalSummaries || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">This Week</p>
                <p className="text-2xl font-bold">{stats?.recentActivity || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">{stats?.statusCounts?.pending || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Model Performance */}
      <Card>
        <CardHeader>
          <CardTitle>AI Model Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(stats?.modelCounts || {}).map(([model, count]) => (
              <div key={model} className="flex items-center justify-between">
                <span className="font-medium capitalize">
                  {model === 'gpt-4o-mini' ? 'OpenAI GPT-4o-mini' : 
                   model === 'gemini-2.5-pro' ? 'Google Gemini 2.5 Pro' : 
                   model === 'claude-sonnet-4.0' ? 'Claude Sonnet 4.0' : model}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold">{count as number}</span>
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ 
                        width: `${Math.min(100, ((count as number) / Math.max(1, stats?.totalCommentaries || 1)) * 100)}%` 
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Processing Status */}
      <Card>
        <CardHeader>
          <CardTitle>Processing Status Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(stats?.statusCounts || {}).map(([status, count]) => (
              <div key={status} className="text-center">
                <div className="text-2xl font-bold mb-1 capitalize">{count as number}</div>
                <div className="text-sm text-muted-foreground capitalize">{status}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CommentaryStats;
