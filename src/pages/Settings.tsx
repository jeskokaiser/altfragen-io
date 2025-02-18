
import React from 'react';
import { useUserPreferences } from '@/contexts/UserPreferencesContext';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

const Settings = () => {
  const { preferences, updatePreferences, isLoading } = useUserPreferences();

  const handleImmediateFeedbackToggle = (checked: boolean) => {
    updatePreferences({ immediateFeedback: checked });
  };

  if (isLoading) {
    return <div className="container mx-auto py-8">Loading...</div>;
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <h1 className="text-3xl font-bold">Settings</h1>
      
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Quiz Preferences</h2>
        
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label htmlFor="immediate-feedback">Immediate Feedback Mode</Label>
            <p className="text-sm text-muted-foreground">
              When enabled, shows the correct answer immediately after a wrong attempt
            </p>
          </div>
          <Switch
            id="immediate-feedback"
            checked={preferences.immediateFeedback}
            onCheckedChange={handleImmediateFeedbackToggle}
          />
        </div>
      </Card>
    </div>
  );
};

export default Settings;
