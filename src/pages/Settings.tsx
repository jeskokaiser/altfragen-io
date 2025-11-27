
import React, { useState, useEffect } from 'react';
import { useUserPreferences } from '@/contexts/UserPreferencesContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { updateUsername } from '@/services/AccountService';
import DeleteAccountSection from '@/components/settings/DeleteAccountSection';
import KeyboardBindingsSettings from '@/components/settings/KeyboardBindingsSettings';
import IgnoredQuestionsSection from '@/components/settings/IgnoredQuestionsSection';

const Settings = () => {
  const {
    preferences,
    updatePreferences,
    isLoading
  } = useUserPreferences();
  const { user, username } = useAuth();
  const [usernameValue, setUsernameValue] = useState(username || '');
  const [isSavingUsername, setIsSavingUsername] = useState(false);

  useEffect(() => {
    setUsernameValue(username || '');
  }, [username]);

  const handleSaveUsername = async () => {
    if (!user) return;

    // Validate username format
    const trimmedUsername = usernameValue.trim();
    if (trimmedUsername && trimmedUsername.length < 3) {
      toast.error('Benutzername muss mindestens 3 Zeichen lang sein');
      return;
    }

    if (trimmedUsername && trimmedUsername.length > 50) {
      toast.error('Benutzername darf maximal 50 Zeichen lang sein');
      return;
    }

    // Check for invalid characters
    if (trimmedUsername && !/^[a-zA-Z0-9_-]+$/.test(trimmedUsername)) {
      toast.error('Benutzername darf nur Buchstaben, Zahlen, Unterstriche und Bindestriche enthalten');
      return;
    }

    setIsSavingUsername(true);
    try {
      await updateUsername(user.id, trimmedUsername || null);
      toast.success('Benutzername aktualisiert');
      // The AuthContext will update automatically on next profile fetch
    } catch (error) {
      console.error('Error updating username:', error);
      const errorMessage = error instanceof Error ? error.message : 'Fehler beim Aktualisieren des Benutzernamens';
      toast.error(errorMessage);
    } finally {
      setIsSavingUsername(false);
    }
  };

  const handleImmediateFeedbackToggle = (checked: boolean) => {
    updatePreferences({
      immediateFeedback: checked
    });
  };

  const handleModelToggle = (modelName: string, checked: boolean) => {
    const currentModels = preferences.selectedAIModels || [];
    const newModels = checked
      ? [...currentModels, modelName]
      : currentModels.filter(m => m !== modelName);
    
    updatePreferences({
      selectedAIModels: newModels
    });
  };

  const aiModels = [
    { key: 'chatgpt', label: 'ChatGPT' },
    { key: 'new-gemini', label: 'Gemini' },
    { key: 'mistral', label: 'Mistral' },
    { key: 'perplexity', label: 'Perplexity' },
    { key: 'deepseek', label: 'DeepSeek' },
  ];

  if (isLoading) {
    return <div className="container mx-auto py-8">Loading...</div>;
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <h1 className="text-3xl font-bold">Einstellungen</h1>
      
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Profil</h2>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Benutzername</Label>
            <p className="text-sm text-muted-foreground">
              Dieser Name wird in öffentlichen Kommentaren angezeigt. Wenn leer, wird deine E-Mail-Adresse verwendet.
            </p>
            <div className="flex gap-2">
              <Input
                id="username"
                value={usernameValue}
                onChange={(e) => setUsernameValue(e.target.value)}
                placeholder="Benutzername eingeben..."
                maxLength={50}
                className="max-w-md"
              />
              <Button
                onClick={handleSaveUsername}
                disabled={isSavingUsername || usernameValue === (username || '')}
              >
                {isSavingUsername ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Speichern...
                  </>
                ) : (
                  'Speichern'
                )}
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Training</h2>
        
        <div className="flex items-center justify-between mb-6">
          <div className="space-y-1">
            <Label htmlFor="immediate-feedback">Immediate Feedback Mode</Label>
            <p className="text-sm text-muted-foreground">Wenn aktiviert, wird die richtige Antwort sofort nach einem falschen Versuch angezeigt, ohne erneute Versuche.</p>
          </div>
          <Switch 
            id="immediate-feedback" 
            checked={preferences.immediateFeedback} 
            onCheckedChange={handleImmediateFeedbackToggle} 
          />
        </div>

        <div className="space-y-4 pt-4 border-t">
          <div className="space-y-2">
            <Label>KI-Modell Auswahl</Label>
            <p className="text-sm text-muted-foreground">Wähle aus, welche KI-Modelle in den Kommentaren angezeigt werden sollen.</p>
          </div>
          <div className="space-y-3">
            {aiModels.map((model) => {
              const isChecked = preferences.selectedAIModels?.includes(model.key) ?? true;
              return (
                <div key={model.key} className="flex items-center space-x-2">
                  <Checkbox
                    id={`model-${model.key}`}
                    checked={isChecked}
                    onCheckedChange={(checked) => handleModelToggle(model.key, checked as boolean)}
                  />
                  <Label
                    htmlFor={`model-${model.key}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {model.label}
                  </Label>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t mt-6">
          <div className="space-y-2">
            <Label htmlFor="enhanced-ai-version">Erweiterte KI-Versionen</Label>
            <p className="text-sm text-muted-foreground">Wähle, welche verbesserte Version von Fragen und Antworten angezeigt werden soll (falls verfügbar).</p>
          </div>
          <Select
            value={preferences.enhancedAIVersion ?? 'none'}
            onValueChange={(value: 'none' | 'chatgpt' | 'gemini') => 
              updatePreferences({ enhancedAIVersion: value })
            }
          >
            <SelectTrigger id="enhanced-ai-version" className="w-full sm:w-[200px]">
              <SelectValue placeholder="Auswählen..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Original</SelectItem>
              <SelectItem value="chatgpt">ChatGPT verbessert</SelectItem>
              <SelectItem value="gemini">Gemini verbessert</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      <KeyboardBindingsSettings />

      <IgnoredQuestionsSection />

      <DeleteAccountSection />
    </div>
  );
};

export default Settings;
