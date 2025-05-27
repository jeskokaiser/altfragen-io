
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Brain, Settings, Play, Pause } from 'lucide-react';

interface AICommentarySettings {
  id: string;
  feature_enabled: boolean;
  auto_trigger_enabled: boolean;
  models_enabled: {
    gemini: boolean;
    openai: boolean;
    claude: boolean;
  };
  rate_limit_per_user_per_day: number;
  processing_delay_minutes: number;
  batch_size: number;
}

const AICommentaryControls = () => {
  const queryClient = useQueryClient();
  const [testQuestionId, setTestQuestionId] = useState('');
  const [manualComment, setManualComment] = useState('');

  // Fetch AI commentary settings
  const { data: settings, isLoading } = useQuery({
    queryKey: ['ai-commentary-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_commentary_settings')
        .select('*')
        .single();
      
      if (error) throw error;
      return data as AICommentarySettings;
    }
  });

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (updates: Partial<AICommentarySettings>) => {
      const { error } = await supabase
        .from('ai_commentary_settings')
        .update(updates)
        .eq('id', settings?.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-commentary-settings'] });
      toast.success('Settings updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update settings: ' + error.message);
    }
  });

  // Manual trigger mutation
  const triggerProcessingMutation = useMutation({
    mutationFn: async (questionId?: string) => {
      const { error } = await supabase.functions.invoke('process-ai-commentary', {
        body: { questionId, manual: true }
      });
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('AI commentary processing triggered successfully');
    },
    onError: (error) => {
      toast.error('Failed to trigger processing: ' + error.message);
    }
  });

  const handleSettingUpdate = (key: keyof AICommentarySettings, value: any) => {
    if (!settings) return;
    
    const updates: Partial<AICommentarySettings> = {};
    updates[key] = value;
    updateSettingsMutation.mutate(updates);
  };

  const handleModelToggle = (model: keyof AICommentarySettings['models_enabled'], enabled: boolean) => {
    if (!settings) return;
    
    const newModelsEnabled = {
      ...settings.models_enabled,
      [model]: enabled
    };
    
    handleSettingUpdate('models_enabled', newModelsEnabled);
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  if (!settings) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <p className="text-muted-foreground">No AI commentary settings found.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Commentary System
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <Label htmlFor="feature-enabled">Enable AI Commentary</Label>
            <Switch
              id="feature-enabled"
              checked={settings.feature_enabled}
              onCheckedChange={(checked) => handleSettingUpdate('feature_enabled', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="auto-trigger">Auto-trigger Processing</Label>
            <Switch
              id="auto-trigger"
              checked={settings.auto_trigger_enabled}
              onCheckedChange={(checked) => handleSettingUpdate('auto_trigger_enabled', checked)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="processing-delay">Processing Delay (minutes)</Label>
              <Input
                id="processing-delay"
                type="number"
                value={settings.processing_delay_minutes}
                onChange={(e) => handleSettingUpdate('processing_delay_minutes', parseInt(e.target.value))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="batch-size">Batch Size</Label>
              <Input
                id="batch-size"
                type="number"
                value={settings.batch_size}
                onChange={(e) => handleSettingUpdate('batch_size', parseInt(e.target.value))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Model Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            AI Model Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="gemini-enabled">Google Gemini 2.5 Pro</Label>
            <Switch
              id="gemini-enabled"
              checked={settings.models_enabled.gemini}
              onCheckedChange={(checked) => handleModelToggle('gemini', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="openai-enabled">OpenAI GPT-4o-mini</Label>
            <Switch
              id="openai-enabled"
              checked={settings.models_enabled.openai}
              onCheckedChange={(checked) => handleModelToggle('openai', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="claude-enabled">Anthropic Claude Sonnet 4.0</Label>
            <Switch
              id="claude-enabled"
              checked={settings.models_enabled.claude}
              onCheckedChange={(checked) => handleModelToggle('claude', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Manual Processing */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="h-5 w-5" />
            Manual Processing
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="question-id">Question ID (optional)</Label>
            <Input
              id="question-id"
              placeholder="Enter specific question ID or leave empty for batch processing"
              value={testQuestionId}
              onChange={(e) => setTestQuestionId(e.target.value)}
            />
          </div>

          <Button
            onClick={() => triggerProcessingMutation.mutate(testQuestionId || undefined)}
            disabled={triggerProcessingMutation.isPending}
            className="w-full"
          >
            {triggerProcessingMutation.isPending ? 'Processing...' : 'Trigger AI Commentary Processing'}
          </Button>
        </CardContent>
      </Card>

      {/* Test Commentary */}
      <Card>
        <CardHeader>
          <CardTitle>Test Commentary Generation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="manual-comment">Manual Test Commentary</Label>
            <Textarea
              id="manual-comment"
              placeholder="Enter test commentary to simulate AI response..."
              value={manualComment}
              onChange={(e) => setManualComment(e.target.value)}
              rows={4}
            />
          </div>

          <Button
            variant="outline"
            onClick={() => {
              if (manualComment.trim()) {
                toast.success('Test commentary saved');
                setManualComment('');
              }
            }}
            className="w-full"
          >
            Save Test Commentary
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AICommentaryControls;
