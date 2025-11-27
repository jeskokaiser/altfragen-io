import React from 'react';
import { AICommentaryData } from '@/types/AIAnswerComments';
import ReactMarkdown from 'react-markdown';
import { Badge } from '@/components/ui/badge';
import { Brain } from 'lucide-react';
import { useUserPreferences } from '@/contexts/UserPreferencesContext';

interface MultiModelAICommentProps {
  commentaryData: AICommentaryData;
  optionLetter: 'A' | 'B' | 'C' | 'D' | 'E';
}

// New models configuration
const newModelNames: { key: keyof AICommentaryData['models']; displayName: string }[] = [
  { key: 'chatgpt', displayName: 'ChatGPT' },
  { key: 'new-gemini', displayName: 'Gemini' },
  { key: 'mistral', displayName: 'Mistral' },
  { key: 'perplexity', displayName: 'Perplexity' },
  { key: 'deepseek', displayName: 'DeepSeek' },
];

// Legacy models configuration
const legacyModelNames: { key: keyof AICommentaryData['models']; displayName: string }[] = [
  { key: 'openai', displayName: 'OpenAI' },
  { key: 'claude', displayName: 'Claude' },
  { key: 'gemini', displayName: 'Gemini' },
];

export const MultiModelAIComment: React.FC<MultiModelAICommentProps> = ({
  commentaryData,
  optionLetter,
}) => {
  const { preferences } = useUserPreferences();
  const optionKey = optionLetter.toLowerCase() as 'a' | 'b' | 'c' | 'd' | 'e';
  
  // Access is controlled by parent component - this component only renders when access is granted
  
  // Check if new models exist (backwards compatibility)
  const hasNewModels = !!(
    commentaryData.models.chatgpt ||
    commentaryData.models['new-gemini'] ||
    commentaryData.models.mistral ||
    commentaryData.models.perplexity ||
    commentaryData.models.deepseek
  );

  // Determine which models to use
  const modelsToUse = hasNewModels ? newModelNames : legacyModelNames;
  
  // Filter comments based on available models and user preferences
  const comments = modelsToUse
    .map(model => {
      const modelData = commentaryData.models[model.key];
      const comment = modelData?.answers[optionKey];
      
      // For new models, check if user has enabled this model
      if (hasNewModels && preferences.selectedAIModels) {
        const modelKey = model.key === 'new-gemini' ? 'new-gemini' : model.key;
        if (!preferences.selectedAIModels.includes(modelKey)) {
          return null;
        }
      }
      
      return comment ? {
        modelName: model.displayName,
        comment: comment
      } : null;
    })
    .filter((c): c is { modelName: string; comment: string } => c !== null && !!c.comment);

  if (comments.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2 mt-2">
        <h4 className="font-semibold text-sm flex items-center gap-2 text-slate-900 dark:text-slate-100">
          <Brain className="h-4 w-4 text-slate-700 dark:text-slate-300" /> 
          KI-Kommentare
        </h4>
        {comments.map(({modelName, comment}) => (
            <div key={modelName} className="p-2 border rounded-md bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                <Badge variant="secondary" className="mb-1">{modelName}</Badge>
                <ReactMarkdown
                  components={{
                    p: ({ node, ...props }) => <p {...props} className="prose prose-sm max-w-none dark:prose-invert text-slate-800 dark:text-slate-200" />,
                    ul: ({ node, ...props }) => <ul {...props} className="prose prose-sm max-w-none list-disc ml-5 dark:prose-invert text-slate-800 dark:text-slate-200" />,
                    ol: ({ node, ...props }) => <ol {...props} className="prose prose-sm max-w-none list-decimal ml-5 dark:prose-invert text-slate-800 dark:text-slate-200" />,
                    code: ({ node, ...props }) => (
                      <code {...props} className={`rounded bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 px-1 py-0.5 ${props.className || ''}`.trim()} />
                    ),
                    strong: ({ node, ...props }) => <strong {...props} className="font-semibold text-slate-900 dark:text-slate-100" />,
                    em: ({ node, ...props }) => <em {...props} className="italic text-slate-800 dark:text-slate-200" />,
                  }}
                >
                  {comment!}
                </ReactMarkdown>
            </div>
        ))}
    </div>
  );
}; 