import React from 'react';
import { AICommentaryData } from '@/types/AIAnswerComments';
import ReactMarkdown from 'react-markdown';
import { Badge } from '@/components/ui/badge';
import { Brain } from 'lucide-react';

interface GeneralAICommentsProps {
  commentaryData: AICommentaryData | undefined;
  isRevealed: boolean;
}

const modelNames: { key: keyof AICommentaryData['models']; displayName: string }[] = [
  { key: 'openai', displayName: 'OpenAI' },
  { key: 'claude', displayName: 'Claude' },
  { key: 'gemini', displayName: 'Gemini' },
];

export const GeneralAIComments: React.FC<GeneralAICommentsProps> = ({
  commentaryData,
  isRevealed,
}) => {
  // Only show when answer is revealed
  if (!isRevealed || !commentaryData) {
    return null;
  }

  // Collect all available general comments
  const generalComments = modelNames.map(model => {
    const modelData = commentaryData.models[model.key];
    const comment = modelData?.general;
    return {
      modelName: model.displayName,
      comment: comment
    };
  }).filter(c => c.comment);

  if (generalComments.length === 0) {
    return null;
  }

  return (
    <div className="mt-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
        <Brain className="h-4 w-4" />
        Allgemeine KI-Kommentare zur Frage
      </div>
      
      <div className="border rounded-lg p-4 bg-white space-y-4">
        {generalComments.map(({ modelName, comment }) => (
          <div key={modelName} className="p-3 border rounded-md bg-slate-50">
            <Badge variant="secondary" className="mb-2">{modelName}</Badge>
            <ReactMarkdown
              components={{
                p: ({ node, ...props }) => <p {...props} className="prose prose-sm max-w-none" />,
                ul: ({ node, ...props }) => <ul {...props} className="prose prose-sm max-w-none list-disc ml-5" />,
                ol: ({ node, ...props }) => <ol {...props} className="prose prose-sm max-w-none list-decimal ml-5" />,
                code: ({ node, ...props }) => (
                  <code {...props} className={`rounded bg-muted px-1 py-0.5 ${props.className || ''}`.trim()} />
                ),
                strong: ({ node, ...props }) => <strong {...props} className="font-semibold" />,
                em: ({ node, ...props }) => <em {...props} className="italic" />,
              }}
            >
              {comment!}
            </ReactMarkdown>
          </div>
        ))}
      </div>
    </div>
  );
};

