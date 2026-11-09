import React from 'react';
import { cn } from '@/lib/utils';

export type ModelName =
  'chatgpt' | 'new-gemini' | 'new-claude' | 'mistral' | 'perplexity' | 'deepseek';

interface ModelIconProps {
  model: ModelName;
  className?: string;
}

// Models carry no colour of their own: colour means right, wrong, warning or premium here.
const modelConfig: Record<ModelName, { letter: string; name: string }> = {
  chatgpt: { letter: 'C', name: 'ChatGPT' },
  'new-gemini': { letter: 'G', name: 'Gemini' },
  'new-claude': { letter: 'A', name: 'Claude' },
  mistral: { letter: 'M', name: 'Mistral' },
  perplexity: { letter: 'P', name: 'Perplexity' },
  deepseek: { letter: 'D', name: 'DeepSeek' },
};

export const ModelIcon: React.FC<ModelIconProps> = ({ model, className }) => {
  const config = modelConfig[model];

  if (!config) {
    return null;
  }

  return (
    <span
      role="img"
      aria-label={config.name}
      title={config.name}
      className={cn(
        'inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-input bg-card font-mono text-[11px] font-semibold text-foreground',
        className,
      )}
    >
      {config.letter}
    </span>
  );
};
