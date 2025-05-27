
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, Brain, Loader2, Crown } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface AICommentarySectionProps {
  questionId: string;
}

const AICommentarySection: React.FC<AICommentarySectionProps> = ({ questionId }) => {
  const { user } = useAuth();
  const [expandedCommentaries, setExpandedCommentaries] = React.useState<Record<string, boolean>>({});

  // Check if user is premium
  const { data: profile } = useQuery({
    queryKey: ['user-profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('is_premium')
        .eq('id', user.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user
  });

  // Get AI commentary summary
  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['ai-commentary-summary', questionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_commentary_summaries')
        .select('*')
        .eq('question_id', questionId)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!user && !!profile?.is_premium
  });

  // Get individual commentaries
  const { data: commentaries, isLoading: commentariesLoading } = useQuery({
    queryKey: ['ai-commentaries', questionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_commentaries')
        .select('*')
        .eq('question_id', questionId)
        .eq('processing_status', 'completed')
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user && !!profile?.is_premium
  });

  // Get question status
  const { data: questionStatus } = useQuery({
    queryKey: ['question-ai-status', questionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('questions')
        .select('ai_commentary_status')
        .eq('id', questionId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user && !!profile?.is_premium
  });

  const toggleCommentary = (modelName: string) => {
    setExpandedCommentaries(prev => ({
      ...prev,
      [modelName]: !prev[modelName]
    }));
  };

  const getModelDisplayName = (modelName: string) => {
    switch (modelName) {
      case 'gpt-4o-mini': return 'OpenAI GPT-4o-mini';
      case 'gemini-2.5-pro': return 'Google Gemini 2.5 Pro';
      case 'claude-sonnet-4.0': return 'Claude Sonnet 4.0';
      default: return modelName;
    }
  };

  const getModelColor = (modelName: string) => {
    switch (modelName) {
      case 'gpt-4o-mini': return 'bg-green-100 text-green-800';
      case 'gemini-2.5-pro': return 'bg-blue-100 text-blue-800';
      case 'claude-sonnet-4.0': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!user) {
    return null;
  }

  if (!profile?.is_premium) {
    return (
      <Card className="mt-6">
        <CardContent className="pt-6 text-center">
          <Crown className="h-12 w-12 mx-auto mb-4 text-yellow-500" />
          <h3 className="text-lg font-semibold mb-2">Premium Feature</h3>
          <p className="text-muted-foreground mb-4">
            AI-powered commentary and insights are available for premium users.
          </p>
          <Button variant="outline">
            Upgrade to Premium
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (questionStatus?.ai_commentary_status === 'pending') {
    return (
      <Card className="mt-6">
        <CardContent className="pt-6 text-center">
          <Loader2 className="h-8 w-8 mx-auto mb-4 animate-spin text-blue-600" />
          <h3 className="text-lg font-semibold mb-2">AI Analysis in Progress</h3>
          <p className="text-muted-foreground">
            Our AI models are analyzing this question. Commentary will be available shortly.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (questionStatus?.ai_commentary_status === 'processing') {
    return (
      <Card className="mt-6">
        <CardContent className="pt-6 text-center">
          <Loader2 className="h-8 w-8 mx-auto mb-4 animate-spin text-orange-600" />
          <h3 className="text-lg font-semibold mb-2">Processing AI Commentary</h3>
          <p className="text-muted-foreground">
            Currently generating insights from multiple AI models...
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!summary && !summaryLoading && questionStatus?.ai_commentary_status === 'completed') {
    return (
      <Card className="mt-6">
        <CardContent className="pt-6 text-center">
          <Brain className="h-8 w-8 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold mb-2">No AI Commentary Available</h3>
          <p className="text-muted-foreground">
            AI commentary could not be generated for this question.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (summaryLoading || commentariesLoading) {
    return (
      <Card className="mt-6">
        <CardContent className="pt-6 text-center">
          <Loader2 className="h-8 w-8 mx-auto mb-4 animate-spin" />
          <p>Loading AI commentary...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-blue-600" />
          AI Educational Commentary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {summary && (
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-semibold mb-2 text-blue-800">Summary</h4>
            <p className="text-blue-700 leading-relaxed">{summary.summary_text}</p>
          </div>
        )}

        {commentaries && commentaries.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-semibold text-sm text-muted-foreground">Individual AI Model Responses</h4>
            {commentaries.map((commentary) => (
              <Collapsible key={commentary.id}>
                <CollapsibleTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-between"
                    onClick={() => toggleCommentary(commentary.model_name)}
                  >
                    <div className="flex items-center gap-2">
                      <Badge className={getModelColor(commentary.model_name)}>
                        {getModelDisplayName(commentary.model_name)}
                      </Badge>
                    </div>
                    {expandedCommentaries[commentary.model_name] ? 
                      <ChevronUp className="h-4 w-4" /> : 
                      <ChevronDown className="h-4 w-4" />
                    }
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2">
                  <div className="p-4 bg-gray-50 rounded-lg border">
                    <p className="text-gray-700 leading-relaxed">{commentary.commentary_text}</p>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AICommentarySection;
