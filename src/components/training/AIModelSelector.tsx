import React from 'react';
import { useUserPreferences } from '@/contexts/UserPreferencesContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu';
import { Brain, Sparkles } from 'lucide-react';

const aiModels = [
  { key: 'chatgpt', label: 'ChatGPT' },
  { key: 'new-gemini', label: 'Gemini' },
  { key: 'mistral', label: 'Mistral' },
  { key: 'perplexity', label: 'Perplexity' },
  { key: 'deepseek', label: 'DeepSeek' },
];

export const AIModelSelector: React.FC = () => {
  const { preferences, updatePreferences } = useUserPreferences();

  const handleModelToggle = (modelName: string, checked: boolean) => {
    const currentModels = preferences.selectedAIModels || [];
    const newModels = checked
      ? [...currentModels, modelName]
      : currentModels.filter(m => m !== modelName);
    
    updatePreferences({
      selectedAIModels: newModels
    });
  };

  const enabledCount = preferences.selectedAIModels?.length || 0;

  const enhancedVersion = preferences.enhancedAIVersion ?? 'none';
  const enhancedLabel = enhancedVersion === 'none' 
    ? 'Original' 
    : enhancedVersion === 'chatgpt' 
      ? 'ChatGPT' 
      : 'Gemini';

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            <span className="hidden sm:inline">KI-Modelle</span>
            <span className="text-xs text-muted-foreground">({enabledCount})</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>KI-Modelle auswählen</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {aiModels.map((model) => {
            const isChecked = preferences.selectedAIModels?.includes(model.key) ?? true;
            return (
              <DropdownMenuCheckboxItem
                key={model.key}
                checked={isChecked}
                onCheckedChange={(checked) => handleModelToggle(model.key, checked)}
              >
                {model.label}
              </DropdownMenuCheckboxItem>
            );
          })}
          <DropdownMenuSeparator />
          <DropdownMenuLabel className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5" />
            Erweiterte Version
          </DropdownMenuLabel>
          <DropdownMenuRadioGroup
            value={enhancedVersion}
            onValueChange={(value) => updatePreferences({ enhancedAIVersion: value as 'none' | 'chatgpt' | 'gemini' })}
          >
            <DropdownMenuRadioItem value="none">Original</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="chatgpt">ChatGPT verbessert</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="gemini">Gemini verbessert</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

