import React from 'react';
import { AICommentaryData } from '@/types/AIAnswerComments';
import ReactMarkdown from 'react-markdown';
import { Badge } from '@/components/ui/badge';
import { Brain } from 'lucide-react';

interface MultiModelAICommentProps {
  commentaryData: AICommentaryData;
  optionLetter: 'A' | 'B' | 'C' | 'D' | 'E';
}

const modelNames: { key: keyof AICommentaryData['models']; displayName: string }[] = [
  { key: 'openai', displayName: 'OpenAI' },
  { key: 'claude', displayName: 'Claude' },
  { key: 'gemini', displayName: 'Gemini' },
];

export const MultiModelAIComment: React.FC<MultiModelAICommentProps> = ({
  commentaryData,
  optionLetter,
}) => {
  const optionKey = optionLetter.toLowerCase() as 'a' | 'b' | 'c' | 'd' | 'e';
  const comments = modelNames.map(model => {
      const modelData = commentaryData.models[model.key];
      const comment = modelData?.answers[optionKey];
      return {
          modelName: model.displayName,
          comment: comment
      };
  }).filter(c => c.comment);

  if (comments.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2 mt-2">
        <h4 className="font-semibold text-sm flex items-center gap-2"><Brain className="h-4 w-4" /> KI-Kommentare</h4>
        {comments.map(({modelName, comment}) => (
            <div key={modelName} className="p-2 border rounded-md bg-white">
                <Badge variant="secondary" className="mb-1">{modelName}</Badge>
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
  );
}; 