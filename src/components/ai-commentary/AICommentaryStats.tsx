
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { BarChart3, Brain, Clock, CheckCircle, AlertCircle, TrendingUp } from 'lucide-react';
import { AIAnswerCommentaryService } from '@/services/AIAnswerCommentaryService';
import { supabase } from '@/integrations/supabase/client';

const AICommentaryStats: React.FC = () => {
  const { data: enhancedStats, isLoading: statsLoading } = useQuery({
    queryKey: ['ai-commentary-enhanced-stats'],
    queryFn: () => AIAnswerCommentaryService.getProcessingStats(),
    refetchInterval: 30000
  });

  const { data: recentActivity, isLoading: activityLoading } = useQuery({
    queryKey: ['ai-commentary-recent-activity'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('questions')
        .select('ai_commentary_processed_at, ai_commentary_status, subject')
        .not('ai_commentary_processed_at', 'is', null)
        .order('ai_commentary_processed_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 60000
  });

  const { data: modelStats, isLoading: modelStatsLoading } = useQuery({
    queryKey: ['ai-commentary-model-stats'],
    queryFn: async () => {
      // Count questions with different types of comments
      const { data: openaiComments, error: openaiError } = await supabase
        .from('ai_answer_comments')
        .select('id', { count: 'exact' })
        .not('openai_general_comment', 'is', null);

      const { data: claudeComments, error: claudeError } = await supabase
        .from('ai_answer_comments')
        .select('id', { count: 'exact' })
        .not('claude_general_comment', 'is', null);

      const { data: geminiComments, error: geminiError } = await supabase
        .from('ai_answer_comments')
        .select('id', { count: 'exact' })
        .not('gemini_general_comment', 'is', null);

      if (openaiError || claudeError || geminiError) {
        throw new Error('Error fetching model stats');
      }

      return {
        openai: openaiComments?.length || 0,
        claude: claudeComments?.length || 0,
        gemini: geminiComments?.length || 0
      };
    },
    refetchInterval: 60000
  });

  if (statsLoading || activityLoading || modelStatsLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const getCompletionRate = () => {
    if (!enhancedStats || enhancedStats.total === 0) return 0;
    return Math.round((enhancedStats.withComments / enhancedStats.total) * 100);
  };

  const getProcessingRate = () => {
    if (!enhancedStats || enhancedStats.total === 0) return 0;
    return Math.round((enhancedStats.processed / enhancedStats.total) * 100);
  };

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Gesamte Fragen</p>
                <p className="text-2xl font-bold">{enhancedStats?.total || 0}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">In Warteschlange</p>
                <p className="text-2xl font-bold text-yellow-600">{enhancedStats?.pending || 0}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
            {enhancedStats && enhancedStats.total > 0 && (
              <Progress 
                value={(enhancedStats.pending / enhancedStats.total) * 100} 
                className="mt-3"
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Mit KI-Kommentaren</p>
                <p className="text-2xl font-bold text-green-600">{enhancedStats?.withComments || 0}</p>
                <p className="text-xs text-muted-foreground">{getCompletionRate()}% abgeschlossen</p>
              </div>
              <Brain className="h-8 w-8 text-green-600" />
            </div>
            {enhancedStats && enhancedStats.total > 0 && (
              <Progress 
                value={getCompletionRate()} 
                className="mt-3"
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Verarbeitet</p>
                <p className="text-2xl font-bold text-blue-600">{enhancedStats?.processed || 0}</p>
                <p className="text-xs text-muted-foreground">{getProcessingRate()}% verarbeitet</p>
              </div>
              <CheckCircle className="h-8 w-8 text-blue-600" />
            </div>
            {enhancedStats && enhancedStats.total > 0 && (
              <Progress 
                value={getProcessingRate()} 
                className="mt-3"
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Model Performance Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">OpenAI GPT-4o-mini</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-green-600">{modelStats?.openai || 0}</p>
                <p className="text-sm text-muted-foreground">Kommentierte Fragen</p>
              </div>
              <Badge className="bg-green-100 text-green-800">Aktiv</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Claude Sonnet 4</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-blue-600">{modelStats?.claude || 0}</p>
                <p className="text-sm text-muted-foreground">Kommentierte Fragen</p>
              </div>
              <Badge className="bg-blue-100 text-blue-800">Aktiv</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Gemini 2.5 Pro</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-purple-600">{modelStats?.gemini || 0}</p>
                <p className="text-sm text-muted-foreground">Kommentierte Fragen</p>
              </div>
              <Badge className="bg-purple-100 text-purple-800">Aktiv</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Letzte Aktivität
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentActivity && recentActivity.length > 0 ? (
            <div className="space-y-3">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b last:border-b-0">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <div>
                      <p className="text-sm font-medium">KI-Kommentare generiert</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(activity.ai_commentary_processed_at).toLocaleString('de-DE')}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline">{activity.subject}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <AlertCircle className="h-8 w-8 mx-auto text-gray-400 mb-2" />
              <p className="text-muted-foreground">Keine aktuelle Aktivität</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AICommentaryStats;
