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
import { Brain } from 'lucide-react';
import type { EnhancedAIVersion } from '@/services/UserPreferencesService';

const aiModels = [
  { key: 'chatgpt', label: 'ChatGPT' },
  { key: 'new-gemini', label: 'Gemini' },
  { key: 'new-claude', label: 'Claude' },
  { key: 'mistral', label: 'Mistral' },
  { key: 'perplexity', label: 'Perplexity' },
  { key: 'deepseek', label: 'DeepSeek' },
];

function useModelChoice() {
  const { preferences, updatePreferences } = useUserPreferences();

  const handleModelToggle = (modelName: string, checked: boolean) => {
    const currentModels = preferences.selectedAIModels || [];
    const newModels = checked
      ? [...currentModels, modelName]
      : currentModels.filter((m) => m !== modelName);

    updatePreferences({
      selectedAIModels: newModels,
    });
  };

  return {
    preferences,
    updatePreferences,
    handleModelToggle,
    enabledCount: preferences.selectedAIModels?.length || 0,
    enhancedVersion: preferences.enhancedAIVersion ?? 'none',
  };
}

/** The model choice as menu items; used by the selector and by the phone "⋯" menu. */
export const AIModelMenuItems: React.FC = () => {
  const { preferences, updatePreferences, handleModelToggle, enhancedVersion } = useModelChoice();
  return (
    <>
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
      <DropdownMenuLabel>Erweiterte Version</DropdownMenuLabel>
      <DropdownMenuRadioGroup
        value={enhancedVersion}
        onValueChange={(value) =>
          updatePreferences({ enhancedAIVersion: value as EnhancedAIVersion })
        }
      >
        <DropdownMenuRadioItem value="none">Original</DropdownMenuRadioItem>
        <DropdownMenuRadioItem value="chatgpt">ChatGPT verbessert</DropdownMenuRadioItem>
        <DropdownMenuRadioItem value="gemini">Gemini verbessert</DropdownMenuRadioItem>
        <DropdownMenuRadioItem value="claude">Claude verbessert</DropdownMenuRadioItem>
      </DropdownMenuRadioGroup>
    </>
  );
};

export const AIModelSelector: React.FC = () => {
  const { enabledCount } = useModelChoice();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm">
          <Brain aria-hidden="true" />
          KI-Modelle
          <span className="text-xs tabular-nums text-muted-foreground">({enabledCount})</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <AIModelMenuItems />
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
