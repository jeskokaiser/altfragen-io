import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Settings, Save, AlertTriangle, Info } from 'lucide-react';
import { useAICommentary } from '@/hooks/useAICommentary';
import { AICommentaryService } from '@/services/AICommentaryService';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';

const AICommentarySettings: React.FC = () => {
  const { settings, refreshSettings } = useAICommentary();
  const [localSettings, setLocalSettings] = useState(settings);
  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleSave = async () => {
    if (!localSettings) return;

    setSaving(true);
    try {
      const success = await AICommentaryService.updateSettings(localSettings);
      if (success) {
        toast.success('Einstellungen erfolgreich gespeichert');
        await refreshSettings();
      } else {
        toast.error('Einstellungen konnten nicht gespeichert werden');
      }
    } catch (error) {
      toast.error('Fehler beim Speichern von Einstellungen');
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (key: string, value: any) => {
    if (!localSettings) return;
    setLocalSettings({ ...localSettings, [key]: value });
  };

  const updateModelSetting = (model: string, enabled: boolean) => {
    if (!localSettings) return;
    setLocalSettings({
      ...localSettings,
      models_enabled: {
        ...localSettings.models_enabled,
        [model]: enabled
      }
    });
  };

  if (!localSettings) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-gray-500">Loading settings...</div>
        </CardContent>
      </Card>
    );
  }

  const enabledModelsCount = Object.values(localSettings.models_enabled).filter(Boolean).length;

  return (
    <div className="space-y-6">
      {/* Global Feature Control */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Global AI Commentary Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="feature-enabled">Enable AI Commentary Feature</Label>
              <p className="text-sm text-muted-foreground">
                Master switch for the entire AI commentary system
              </p>
            </div>
            <Switch
              id="feature-enabled"
              checked={localSettings.feature_enabled}
              onCheckedChange={(checked) => updateSetting('feature_enabled', checked)}
            />
          </div>



          <Separator />

          <div className="space-y-2">
            <Label htmlFor="free-daily-limit">Free AI Comments Daily Limit</Label>
            <Input
              id="free-daily-limit"
              type="number"
              value={localSettings.free_ai_daily_limit || 10}
              onChange={(e) => updateSetting('free_ai_daily_limit', parseInt(e.target.value))}
              min="1"
              max="100"
            />
            <p className="text-xs text-muted-foreground">
              Number of free AI comments available per day for non-premium users (1-100)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* AI Models Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>AI Models Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="space-y-1">
                <Label htmlFor="openai-enabled" className="font-medium">OpenAI GPT o4-mini</Label>
                <p className="text-sm text-muted-foreground">Fast and cost-effective model for generating commentaries</p>
              </div>
              <Switch
                id="openai-enabled"
                checked={localSettings.models_enabled.openai}
                onCheckedChange={(checked) => updateModelSetting('openai', checked)}
              />
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="space-y-1">
                <Label htmlFor="claude-enabled" className="font-medium">Grok 3 (Fallback Mistral)</Label>
                <p className="text-sm text-muted-foreground">Advanced reasoning capabilities for complex educational content</p>
              </div>
              <Switch
                id="claude-enabled"
                checked={localSettings.models_enabled.claude}
                onCheckedChange={(checked) => updateModelSetting('claude', checked)}
              />
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="space-y-1">
                <Label htmlFor="gemini-enabled" className="font-medium">Google Gemini 2.5 Pro</Label>
                <p className="text-sm text-muted-foreground">Comprehensive analysis and educational insights</p>
              </div>
              <Switch
                id="gemini-enabled"
                checked={localSettings.models_enabled.gemini}
                onCheckedChange={(checked) => updateModelSetting('gemini', checked)}
              />
            </div>
          </div>

          {enabledModelsCount === 0 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                At least one AI model must be enabled for commentary generation to work.
              </AlertDescription>
            </Alert>
          )}

          {enabledModelsCount > 0 && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                {enabledModelsCount} model(s) enabled. Each question will be processed by all enabled models to generate comprehensive commentaries.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Processing Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Processing Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="batch-size">Batch Size</Label>
              <Input
                id="batch-size"
                type="number"
                value={localSettings.batch_size}
                onChange={(e) => updateSetting('batch_size', parseInt(e.target.value))}
                min="1"
                max="20"
              />
              <p className="text-xs text-muted-foreground">
                Number of questions to process in each batch (1-20)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="delay">Processing Delay (minutes)</Label>
              <Input
                id="delay"
                type="number"
                value={localSettings.processing_delay_minutes}
                onChange={(e) => updateSetting('processing_delay_minutes', parseInt(e.target.value))}
                min="1"
                max="1440"
              />
              <p className="text-xs text-muted-foreground">
                Minimum time to wait before processing new questions (1-1440 minutes)
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="rate-limit">Rate Limit (per user per day)</Label>
            <Input
              id="rate-limit"
              type="number"
              value={localSettings.rate_limit_per_user_per_day}
              onChange={(e) => updateSetting('rate_limit_per_user_per_day', parseInt(e.target.value))}
              min="1"
              max="1000"
            />
            <p className="text-xs text-muted-foreground">
              Maximum number of AI commentaries a user can generate per day (1-1000)
            </p>
          </div>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Processing runs automatically every minute via cron job. Questions are processed after the specified delay to allow for batching.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Save Button */}
      <Card>
        <CardContent className="pt-6">
          <Button 
            onClick={handleSave} 
            disabled={saving || enabledModelsCount === 0}
            className="w-full"
            size="lg"
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving Settings...' : 'Save All Settings'}
          </Button>
          
          {enabledModelsCount === 0 && (
            <p className="text-sm text-muted-foreground text-center mt-2">
              Enable at least one AI model to save settings
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AICommentarySettings;
