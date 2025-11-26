import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, MessageSquare, NotebookPen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import CommentList from './CommentList';
import CommentForm from './CommentForm';
import { getCommentsForQuestion, createComment, updateComment } from '@/services/CommentService';
import { CommentWithReplies } from '@/types/Comment';
import { useAuth } from '@/contexts/AuthContext';

interface CommentsSectionProps {
  questionId: string;
  questionVisibility: 'private' | 'university' | 'public' | null;
}

const CommentsSection: React.FC<CommentsSectionProps> = ({
  questionId,
  questionVisibility,
}) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const allowPublicComments = questionVisibility === 'university';

  // Fetch all comments (they're filtered by RLS)
  const { data: comments, isLoading, error } = useQuery({
    queryKey: ['question-comments', questionId, user?.id],
    queryFn: () => getCommentsForQuestion(questionId, user?.id || ''),
    enabled: !!questionId && !!user?.id,
  });

  const handleCommentsUpdate = () => {
    queryClient.invalidateQueries({ queryKey: ['question-comments', questionId, user?.id] });
  };

  // Separate private notes and public comments
  // Private notes are root-level comments that are private (replies are already nested)
  const privateNotes: CommentWithReplies[] = (comments || []).filter(
    (comment) => comment.is_private
  );

  const publicComments: CommentWithReplies[] = (comments || []).filter(
    (comment) => !comment.is_private
  );

  // Get the most recent private note (we'll update this one, or create new if none exists)
  const latestPrivateNote = privateNotes.length > 0 
    ? privateNotes.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
    : null;

  // Combine all private notes content if multiple exist (newest first)
  const combinedNotesContent = privateNotes.length > 0
    ? privateNotes
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .map(note => note.content)
        .join('\n\n---\n\n')
    : '';

  // State for private notes textarea
  const [privateNoteContent, setPrivateNoteContent] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);

  // Load existing notes into textarea
  useEffect(() => {
    if (combinedNotesContent && !isSavingNote) {
      setPrivateNoteContent(combinedNotesContent);
    } else if (!combinedNotesContent && !isLoading) {
      setPrivateNoteContent('');
    }
  }, [combinedNotesContent, isLoading, isSavingNote]);

  const handleSavePrivateNote = async () => {
    if (!user) return;

    setIsSavingNote(true);

    try {
      if (latestPrivateNote) {
        // Update existing note
        await updateComment(latestPrivateNote.id, user.id, {
          content: privateNoteContent.trim(),
        });
        toast.success('Notiz aktualisiert');
      } else if (privateNoteContent.trim()) {
        // Create new note
        await createComment({
          question_id: questionId,
          content: privateNoteContent.trim(),
          is_private: true,
        }, user.id);
        toast.success('Notiz gespeichert');
      }
      handleCommentsUpdate();
    } catch (error) {
      console.error('Error saving private note:', error);
      toast.error('Fehler beim Speichern der Notiz');
    } finally {
      setIsSavingNote(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-4">
        {/* Private Notes Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <NotebookPen className="h-4 w-4" />
            <h3 className="font-semibold">Private Notizen</h3>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="text-center py-8 text-destructive">
              Fehler beim Laden der Notizen
            </div>
          ) : (
            <div className="space-y-3">
              <Textarea
                value={privateNoteContent}
                onChange={(e) => setPrivateNoteContent(e.target.value)}
                placeholder="Private Notiz hinzufügen..."
                rows={6}
                className="resize-none"
                disabled={isSavingNote}
              />
              <div className="flex justify-end">
                <Button
                  onClick={handleSavePrivateNote}
                  disabled={isSavingNote || !privateNoteContent.trim()}
                >
                  {isSavingNote ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Speichern...
                    </>
                  ) : (
                    latestPrivateNote ? 'Notiz aktualisieren' : 'Notiz speichern'
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Public Comments Section - only shown for university questions */}
        {allowPublicComments && (
          <div className="space-y-3 border-t pt-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              <h3 className="font-semibold">Öffentliche Kommentare</h3>
              {publicComments.length > 0 && (
                <span className="px-2 py-0.5 text-xs bg-muted rounded-full">
                  {publicComments.length}
                </span>
              )}
            </div>

            <CommentForm
              questionId={questionId}
              isPrivate={false}
              allowPublicComments={allowPublicComments}
              onSubmit={handleCommentsUpdate}
              userId={user.id}
            />

            <div className="border-t pt-3">
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : error ? (
                <div className="text-center py-8 text-destructive">
                  Fehler beim Laden der Kommentare
                </div>
              ) : (
                <ScrollArea className="h-[300px] pr-4">
                  <CommentList
                    comments={publicComments}
                    currentUserId={user.id}
                    questionId={questionId}
                    allowPublicComments={allowPublicComments}
                    onUpdate={handleCommentsUpdate}
                  />
                </ScrollArea>
              )}
            </div>
          </div>
        )}
    </div>
  );
};

export default CommentsSection;

