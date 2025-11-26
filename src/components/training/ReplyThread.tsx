import React, { useState } from 'react';
import CommentItem from './CommentItem';
import CommentForm from './CommentForm';
import { CommentWithReplies } from '@/types/Comment';

interface ReplyThreadProps {
  comment: CommentWithReplies;
  currentUserId: string;
  questionId: string;
  allowPublicComments: boolean;
  onUpdate: () => void;
  onDelete: () => void;
}

const ReplyThread: React.FC<ReplyThreadProps> = ({
  comment,
  currentUserId,
  questionId,
  allowPublicComments,
  onUpdate,
  onDelete,
}) => {
  const [showReplyForm, setShowReplyForm] = useState(false);

  const handleReply = (parentId: string) => {
    setShowReplyForm(true);
  };

  const handleReplySubmitted = () => {
    setShowReplyForm(false);
    onUpdate();
  };

  const handleReplyCancel = () => {
    setShowReplyForm(false);
  };

  return (
    <div className="space-y-3">
      <div className="pl-0">
        <CommentItem
          comment={comment}
          currentUserId={currentUserId}
          allowPublicComments={allowPublicComments}
          onUpdate={onUpdate}
          onDelete={onDelete}
          onReply={handleReply}
        />
      </div>

      {showReplyForm && (
        <div className="pl-6 border-l-2 border-muted ml-3">
          <CommentForm
            questionId={questionId}
            isPrivate={false}
            allowPublicComments={allowPublicComments}
            parentId={comment.id}
            onSubmit={handleReplySubmitted}
            onCancel={handleReplyCancel}
            userId={currentUserId}
          />
        </div>
      )}

      {comment.replies && comment.replies.length > 0 && (
        <div className="space-y-3 pl-6 border-l-2 border-muted ml-3">
          {comment.replies.map((reply) => (
            <ReplyThread
              key={reply.id}
              comment={reply}
              currentUserId={currentUserId}
              questionId={questionId}
              allowPublicComments={allowPublicComments}
              onUpdate={onUpdate}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ReplyThread;

