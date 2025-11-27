import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { createComment } from '@/services/CommentService';
import { CreateCommentInput } from '@/types/Comment';

interface CommentFormProps {
  questionId: string;
  isPrivate: boolean;
  allowPublicComments: boolean;
  parentId?: string | null;
  onSubmit: () => void;
  onCancel?: () => void;
  userId: string;
}

const CommentForm: React.FC<CommentFormProps> = ({
  questionId,
  isPrivate,
  allowPublicComments,
  parentId,
  onSubmit,
  onCancel,
  userId,
}) => {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim()) {
      toast.error('Bitte gib einen Kommentar ein');
      return;
    }

    if (content.trim().length < 3) {
      toast.error('Der Kommentar muss mindestens 3 Zeichen lang sein');
      return;
    }

    setIsSubmitting(true);

    try {
      const input: CreateCommentInput = {
        question_id: questionId,
        content: content.trim(),
        is_private: isPrivate,
        parent_id: parentId || null,
      };

      await createComment(input, userId);
      toast.success(isPrivate ? 'Notiz gespeichert' : 'Kommentar veröffentlicht');
      setContent('');
      onSubmit();
    } catch (error) {
      console.error('Error creating comment:', error);
      toast.error('Fehler beim Speichern des Kommentars');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setContent('');
    if (onCancel) {
      onCancel();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="space-y-2">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={parentId ? 'Antwort schreiben...' : isPrivate ? 'Private Notiz hinzufügen...' : 'Kommentar schreiben...'}
          rows={4}
          className="resize-none"
          disabled={isSubmitting}
        />
      </div>

      {parentId && (
        <div className="text-xs text-muted-foreground">
          Du antwortest auf einen Kommentar
        </div>
      )}

      <div className="flex gap-2 justify-end">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            Abbrechen
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting || !content.trim()}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Speichern...
            </>
          ) : (
            parentId ? 'Antworten' : isPrivate ? 'Notiz speichern' : 'Kommentar veröffentlichen'
          )}
        </Button>
      </div>
    </form>
  );
};

export default CommentForm;

