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
    commentaryData.models['new-claude'] ||
    commentaryData.models.mistral ||
    commentaryData.models.perplexity ||
    commentaryData.models.deepseek
  );

  // Determine which models to use
  const modelsToUse = hasNewModels ? newModelNames : legacyModelNames;

  // Filter comments based on available models and user preferences
  const comments = modelsToUse
    .map((model) => {
      const modelData = commentaryData.models[model.key];
      const comment = modelData?.answers[optionKey];

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
          }
        : null;
    })
    .filter((c): c is { modelName: string; comment: string } => c !== null && !!c.comment);

  if (comments.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2 mt-2">
      <h4 className="font-semibold text-sm flex items-center gap-2 text-foreground">
        <Brain className="h-4 w-4 text-foreground" />
        KI-Kommentare
      </h4>
      {comments.map(({ modelName, comment }) => (
        <div key={modelName} className="p-2 border rounded-md bg-card border-border">
          <Badge variant="secondary" className="mb-1">
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
        </div>
      ))}
    </div>
  );
};
