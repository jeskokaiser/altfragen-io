
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Brain, RefreshCw } from 'lucide-react';
import { useAICommentary } from '@/hooks/useAICommentary';
import { AICommentary } from '@/types/AICommentary';

interface AICommentaryDisplayProps {
  questionId: string;
}

const AICommentaryDisplay: React.FC<AICommentaryDisplayProps> = ({ questionId }) => {
  const { commentaries, summary, loading, queueForCommentary, refreshCommentaries } = useAICommentary(questionId);

  const handleQueueCommentary = async () => {
    await queueForCommentary();
  };

  const getModelBadgeColor = (modelName: string) => {
    switch (modelName.toLowerCase()) {
      case 'openai':
        return 'bg-green-100 text-green-800';
      case 'claude':
        return 'bg-purple-100 text-purple-800';
      case 'gemini':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Brain className="h-5 w-5" />
          AI Commentary
        </h3>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshCommentaries}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={handleQueueCommentary}
            disabled={loading}
          >
            Generate Commentary
          </Button>
        </div>
      </div>

      {summary && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-700">{summary.summary_text}</p>
          </CardContent>
        </Card>
      )}

      {commentaries.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium">Individual Model Responses</h4>
          {commentaries.map((commentary) => (
            <Card key={commentary.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <Badge className={getModelBadgeColor(commentary.model_name)}>
                    {commentary.model_name.toUpperCase()}
                  </Badge>
                  <span className="text-xs text-gray-500">
                    {new Date(commentary.created_at).toLocaleDateString()}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700">{commentary.commentary_text}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {commentaries.length === 0 && !summary && !loading && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-gray-500">
              <Brain className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No AI commentary available yet.</p>
              <p className="text-xs mt-1">Click "Generate Commentary" to create AI analysis for this question.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AICommentaryDisplay;
