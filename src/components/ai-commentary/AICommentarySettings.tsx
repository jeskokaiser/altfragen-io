
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Settings, Save } from 'lucide-react';
import { useAICommentary } from '@/hooks/useAICommentary';
import { AICommentaryService } from '@/services/AICommentaryService';
import { toast } from 'sonner';

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
        toast.success('Settings saved successfully');
        await refreshSettings();
      } else {
        toast.error('Failed to save settings');
      }
    } catch (error) {
      toast.error('Error saving settings');
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          AI Commentary Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <Label htmlFor="feature-enabled">Enable AI Commentary Feature</Label>
          <Switch
            id="feature-enabled"
            checked={localSettings.feature_enabled}
            onCheckedChange={(checked) => updateSetting('feature_enabled', checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="auto-trigger">Auto-trigger Commentary</Label>
          <Switch
            id="auto-trigger"
            checked={localSettings.auto_trigger_enabled}
            onCheckedChange={(checked) => updateSetting('auto_trigger_enabled', checked)}
          />
        </div>

        <div className="space-y-3">
          <Label>AI Models</Label>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="openai-enabled">OpenAI</Label>
              <Switch
                id="openai-enabled"
                checked={localSettings.models_enabled.openai}
                onCheckedChange={(checked) => updateModelSetting('openai', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="claude-enabled">Claude</Label>
              <Switch
                id="claude-enabled"
                checked={localSettings.models_enabled.claude}
                onCheckedChange={(checked) => updateModelSetting('claude', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="gemini-enabled">Gemini</Label>
              <Switch
                id="gemini-enabled"
                checked={localSettings.models_enabled.gemini}
                onCheckedChange={(checked) => updateModelSetting('gemini', checked)}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
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
        </div>

        <Button 
          onClick={handleSave} 
          disabled={saving}
          className="w-full"
        >
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default AICommentarySettings;
