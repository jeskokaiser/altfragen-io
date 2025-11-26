import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Pencil, Trash2, Reply, Check, X } from 'lucide-react';
import { CommentWithUser } from '@/types/Comment';
import { updateComment, deleteComment } from '@/services/CommentService';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface CommentItemProps {
  comment: CommentWithUser;
  currentUserId: string;
  allowPublicComments: boolean;
  onUpdate: () => void;
  onDelete: () => void;
  onReply: (parentId: string) => void;
}

const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  currentUserId,
  allowPublicComments,
  onUpdate,
  onDelete,
  onReply,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isAuthor = comment.user_id === currentUserId;
  const canReply = !comment.is_private && allowPublicComments && !comment.parent_id;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'gerade eben';
    if (diffMins < 60) return `vor ${diffMins} Min.`;
    if (diffHours < 24) return `vor ${diffHours} Std.`;
    if (diffDays < 7) return `vor ${diffDays} Tag${diffDays > 1 ? 'en' : ''}`;
    
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleEdit = () => {
    setEditContent(comment.content);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setEditContent(comment.content);
    setIsEditing(false);
  };

  const handleSaveEdit = async () => {
    if (!editContent.trim()) {
      toast.error('Kommentar darf nicht leer sein');
      return;
    }

    if (editContent.trim().length < 3) {
      toast.error('Der Kommentar muss mindestens 3 Zeichen lang sein');
      return;
    }

    setIsUpdating(true);
    try {
      await updateComment(comment.id, currentUserId, { content: editContent.trim() });
      toast.success('Kommentar aktualisiert');
      setIsEditing(false);
      onUpdate();
    } catch (error) {
      console.error('Error updating comment:', error);
      toast.error('Fehler beim Aktualisieren des Kommentars');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Möchtest du diesen Kommentar wirklich löschen?')) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteComment(comment.id, currentUserId);
      toast.success('Kommentar gelöscht');
      onDelete();
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast.error('Fehler beim Löschen des Kommentars');
    } finally {
      setIsDeleting(false);
    }
  };

  const displayName = comment.is_private
    ? 'Du'
    : comment.user_name || comment.user_email?.split('@')[0] || 'Unbekannt';

  return (
    <div className="space-y-2">
      <div className={`rounded-lg border p-3 ${comment.is_private ? 'bg-muted/50' : 'bg-background'}`}>
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">{displayName}</span>
              {comment.is_private && (
                <span className="text-xs px-2 py-0.5 bg-muted rounded-md">Privat</span>
              )}
            </div>
            <span className="text-xs text-muted-foreground">
              {formatDate(comment.created_at)}
              {comment.updated_at !== comment.created_at && ' (bearbeitet)'}
            </span>
          </div>

          {isAuthor && !isEditing && (
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleEdit}
                className="h-8 w-8 p-0"
                disabled={isDeleting}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </Button>
            </div>
          )}
        </div>

        {isEditing ? (
          <div className="space-y-2">
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={3}
              className="resize-none"
              disabled={isUpdating}
            />
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancelEdit}
                disabled={isUpdating}
              >
                <X className="h-4 w-4 mr-1" />
                Abbrechen
              </Button>
              <Button
                size="sm"
                onClick={handleSaveEdit}
                disabled={isUpdating || !editContent.trim()}
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    Speichern...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-1" />
                    Speichern
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-sm whitespace-pre-wrap break-words">
            {comment.content}
          </div>
        )}

        {canReply && !isEditing && (
          <div className="mt-2 pt-2 border-t">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onReply(comment.id)}
              className="h-8 text-xs"
            >
              <Reply className="h-3 w-3 mr-1" />
              Antworten
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommentItem;

