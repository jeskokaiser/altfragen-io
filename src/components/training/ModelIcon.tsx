import React from 'react';
import { cn } from '@/lib/utils';

export type ModelName = 'chatgpt' | 'new-gemini' | 'mistral' | 'perplexity' | 'deepseek';

interface ModelIconProps {
  model: ModelName;
  className?: string;
}

const modelConfig: Record<ModelName, { letter: string; color: string; bgColor: string }> = {
  'chatgpt': { letter: 'C', color: 'text-emerald-700 dark:text-emerald-300', bgColor: 'bg-emerald-100 dark:bg-emerald-900/40' },
  'new-gemini': { letter: 'G', color: 'text-blue-700 dark:text-blue-300', bgColor: 'bg-blue-100 dark:bg-blue-900/40' },
  'mistral': { letter: 'M', color: 'text-purple-700 dark:text-purple-300', bgColor: 'bg-purple-100 dark:bg-purple-900/40' },
  'perplexity': { letter: 'P', color: 'text-orange-700 dark:text-orange-300', bgColor: 'bg-orange-100 dark:bg-orange-900/40' },
  'deepseek': { letter: 'D', color: 'text-indigo-700 dark:text-indigo-300', bgColor: 'bg-indigo-100 dark:bg-indigo-900/40' },
};

export const ModelIcon: React.FC<ModelIconProps> = ({ model, className }) => {
  const config = modelConfig[model];
  
  if (!config) {
    return null;
  }

  return (
    <div
      className={cn(
        'w-5 h-5 rounded-full flex items-center justify-center text-xs font-semibold',
        config.bgColor,
        config.color,
        className
      )}
      title={model}
    >
      {config.letter}
    </div>
  );
};

