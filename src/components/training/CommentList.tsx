import React from 'react';
import ReplyThread from './ReplyThread';
import { CommentWithReplies } from '@/types/Comment';

interface CommentListProps {
  comments: CommentWithReplies[];
  currentUserId: string;
  questionId: string;
  allowPublicComments: boolean;
  onUpdate: () => void;
}

const CommentList: React.FC<CommentListProps> = ({
  comments,
  currentUserId,
  questionId,
  allowPublicComments,
  onUpdate,
}) => {
  const handleDelete = () => {
    onUpdate();
  };

  if (comments.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        <p>Noch nichts vorhanden.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {comments.map((comment) => (
        <ReplyThread
          key={comment.id}
          comment={comment}
          currentUserId={currentUserId}
          questionId={questionId}
          allowPublicComments={allowPublicComments}
          onUpdate={onUpdate}
          onDelete={handleDelete}
        />
      ))}
    </div>
  );
};

export default CommentList;

