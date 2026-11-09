import React from 'react';
import { AICommentaryData, AISource } from '@/types/AIAnswerComments';
import ReactMarkdown from 'react-markdown';
import { Badge } from '@/components/ui/badge';
import { Brain } from 'lucide-react';
import { useUserPreferences } from '@/contexts/UserPreferencesContext';

interface GeneralAICommentsProps {
  commentaryData: AICommentaryData | undefined;
  isRevealed: boolean;
}

// New models configuration
const newModelNames: { key: keyof AICommentaryData['models']; displayName: string }[] = [
  { key: 'chatgpt', displayName: 'ChatGPT' },
  { key: 'new-gemini', displayName: 'Gemini' },
  { key: 'new-claude', displayName: 'Claude' },
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

export const GeneralAIComments: React.FC<GeneralAICommentsProps> = ({
  commentaryData,
  isRevealed,
}) => {
  const { preferences } = useUserPreferences();

  // Access is controlled by parent component - this component only renders when access is granted
  if (!isRevealed || !commentaryData) {
    return null;
  }

  // Check if new models exist (backwards compatibility)
  const hasNewModels = !!(
    commentaryData.models.chatgpt ||
    commentaryData.models['new-gemini'] ||
    commentaryData.models['new-claude'] ||
    commentaryData.models.mistral ||
    commentaryData.models.perplexity ||
    commentaryData.models.deepseek
  );

  // Determine which models to use
  const modelsToUse = hasNewModels ? newModelNames : legacyModelNames;

  // Collect all available general comments
  const generalComments = modelsToUse
    .map((model) => {
      const modelData = commentaryData.models[model.key];
      const comment = modelData?.general;

      // For new models, check if user has enabled this model
      if (hasNewModels && preferences.selectedAIModels) {
        const modelKey = model.key === 'new-gemini' ? 'new-gemini' : model.key;
        if (!preferences.selectedAIModels.includes(modelKey)) {
          return null;
        }
      }

      return comment
        ? {
            modelName: model.displayName,
            comment: comment,
            sources: modelData?.sources ?? [],
          }
        : null;
    })
    .filter(
      (c): c is { modelName: string; comment: string; sources: AISource[] } =>
        c !== null && !!c.comment,
    );

  if (generalComments.length === 0) {
    return null;
  }

  return (
    <div className="mt-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
        <Brain className="h-4 w-4 text-foreground" />
        Allgemeine KI-Kommentare zur Frage
      </div>

      <div className="border rounded-lg p-4 bg-card border-border space-y-4">
        {generalComments.map(({ modelName, comment, sources }) => (
          <div key={modelName} className="p-3 border rounded-md bg-muted border-border">
            <Badge variant="secondary" className="mb-2">
              {modelName}
            </Badge>
            <ReactMarkdown
              components={{
                p: ({ node, ...props }) => (
                  <p {...props} className="mb-2 leading-relaxed text-foreground last:mb-0" />
                ),
                ul: ({ node, ...props }) => (
                  <ul
                    {...props}
                    className="mb-2 ml-5 list-disc space-y-1 text-foreground last:mb-0"
                  />
                ),
                ol: ({ node, ...props }) => (
                  <ol
                    {...props}
                    className="mb-2 ml-5 list-decimal space-y-1 text-foreground last:mb-0"
                  />
                ),
                code: ({ node, ...props }) => (
                  <code
                    {...props}
                    className={`rounded bg-muted text-foreground px-1 py-0.5 ${props.className || ''}`.trim()}
                  />
                ),
                strong: ({ node, ...props }) => (
                  <strong {...props} className="font-semibold text-foreground" />
                ),
                em: ({ node, ...props }) => <em {...props} className="italic text-foreground" />,
              }}
            >
              {comment!}
            </ReactMarkdown>
            {sources.length > 0 && (
              <div className="mt-2 text-xs text-muted-foreground">
                <span className="font-semibold">Quellen:</span>
                <ol className="mt-1 space-y-0.5">
                  {sources.map((source, index) => (
                    <li key={source.url}>
                      [{source.id ?? index + 1}]{' '}
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline hover:text-primary break-all"
                      >
                        {source.title}
                      </a>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
