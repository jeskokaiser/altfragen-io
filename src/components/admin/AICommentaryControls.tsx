
import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Play, Pause, Settings, Save } from 'lucide-react';

const AICommentaryControls = () => {
  const queryClient = useQueryClient();
  const [isUpdating, setIsUpdating] = useState(false);

  const { data: settings, isLoading } = useQuery({
    queryKey: ['ai-commentary-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_commentary_settings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (error) throw error;
      return data;
    }
  });

  const { data: queueStats } = useQuery({
    queryKey: ['commentary-queue-stats'],
    queryFn: async () => {
      const { data: pending } = await supabase
        .from('questions')
        .select('id', { count: 'exact' })
        .eq('ai_commentary_status', 'pending');

      const { data: processing } = await supabase
        .from('questions')
        .select('id', { count: 'exact' })
        .eq('ai_commentary_status', 'processing');

      const { data: completed } = await supabase
        .from('questions')
        .select('id', { count: 'exact' })
        .eq('ai_commentary_status', 'completed');

      return {
        pending: pending?.length || 0,
        processing: processing?.length || 0,
        completed: completed?.length || 0
      };
    },
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  const updateSettings = async (updates: any) => {
    if (!settings?.id) return;
    
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('ai_commentary_settings')
        .update(updates)
        .eq('id', settings.id);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['ai-commentary-settings'] });
      toast.success('Settings updated successfully');
    } catch (error) {
      console.error('Error updating settings:', error);
      toast.error('Failed to update settings');
    } finally {
      setIsUpdating(false);
    }
  };

  const triggerManualProcessing = async () => {
    try {
      const { error } = await supabase.functions.invoke('process-ai-commentary-cron', {
        body: { manual: true }
      });

      if (error) throw error;

      toast.success('Manual processing triggered');
      queryClient.invalidateQueries({ queryKey: ['commentary-queue-stats'] });
    } catch (error) {
      console.error('Error triggering manual processing:', error);
      toast.error('Failed to trigger processing');
    }
  };

  if (isLoading) {
    return <div>Loading settings...</div>;
  }

  if (!settings) {
    return <div>Failed to load settings</div>;
  }

  return (
    <div className="space-y-6">
      {/* Queue Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Processing Queue Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{queueStats?.pending || 0}</div>
              <div className="text-sm text-muted-foreground">Pending</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{queueStats?.processing || 0}</div>
              <div className="text-sm text-muted-foreground">Processing</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{queueStats?.completed || 0}</div>
              <div className="text-sm text-muted-foreground">Completed</div>
            </div>
          </div>
          <Button onClick={triggerManualProcessing} className="w-full">
            <Play className="h-4 w-4 mr-2" />
            Trigger Manual Processing
          </Button>
        </CardContent>
      </Card>

      {/* Feature Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Feature Controls</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="feature-enabled">AI Commentary System</Label>
              <p className="text-sm text-muted-foreground">
                Enable or disable the entire AI commentary system
              </p>
            </div>
            <Switch
              id="feature-enabled"
              checked={settings.feature_enabled}
              onCheckedChange={(checked) => updateSettings({ feature_enabled: checked })}
              disabled={isUpdating}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="auto-trigger">Automatic Processing</Label>
              <p className="text-sm text-muted-foreground">
                Automatically process questions after delay period
              </p>
            </div>
            <Switch
              id="auto-trigger"
              checked={settings.auto_trigger_enabled}
              onCheckedChange={(checked) => updateSettings({ auto_trigger_enabled: checked })}
              disabled={isUpdating}
            />
          </div>
        </CardContent>
      </Card>

      {/* AI Models */}
      <Card>
        <CardHeader>
          <CardTitle>AI Models</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(settings.models_enabled || {}).map(([model, enabled]) => (
            <div key={model} className="flex items-center justify-between">
              <div>
                <Label htmlFor={`model-${model}`} className="capitalize">
                  {model === 'openai' ? 'OpenAI GPT-4o-mini' : 
                   model === 'gemini' ? 'Google Gemini 2.5 Pro' : 
                   model === 'claude' ? 'Claude Sonnet 4.0' : model}
                </Label>
              </div>
              <Switch
                id={`model-${model}`}
                checked={enabled}
                onCheckedChange={(checked) => {
                  const newModels = { ...settings.models_enabled, [model]: checked };
                  updateSettings({ models_enabled: newModels });
                }}
                disabled={isUpdating}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Processing Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Processing Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="delay-minutes">Processing Delay (minutes)</Label>
            <Input
              id="delay-minutes"
              type="number"
              min="1"
              max="1440"
              value={settings.processing_delay_minutes}
              onChange={(e) => {
                const value = parseInt(e.target.value);
                if (!isNaN(value)) {
                  updateSettings({ processing_delay_minutes: value });
                }
              }}
              disabled={isUpdating}
            />
            <p className="text-sm text-muted-foreground mt-1">
              How long to wait before processing new questions
            </p>
          </div>

          <div>
            <Label htmlFor="batch-size">Batch Size</Label>
            <Input
              id="batch-size"
              type="number"
              min="1"
              max="20"
              value={settings.batch_size}
              onChange={(e) => {
                const value = parseInt(e.target.value);
                if (!isNaN(value)) {
                  updateSettings({ batch_size: value });
                }
              }}
              disabled={isUpdating}
            />
            <p className="text-sm text-muted-foreground mt-1">
              Number of questions to process in each batch
            </p>
          </div>

          <div>
            <Label htmlFor="rate-limit">Daily Rate Limit per User</Label>
            <Input
              id="rate-limit"
              type="number"
              min="1"
              max="1000"
              value={settings.rate_limit_per_user_per_day}
              onChange={(e) => {
                const value = parseInt(e.target.value);
                if (!isNaN(value)) {
                  updateSettings({ rate_limit_per_user_per_day: value });
                }
              }}
              disabled={isUpdating}
            />
            <p className="text-sm text-muted-foreground mt-1">
              Maximum commentaries per user per day
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AICommentaryControls;
