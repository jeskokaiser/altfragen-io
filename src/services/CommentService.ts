import { supabase } from '@/integrations/supabase/client';
import { Comment, CommentWithUser, CommentWithReplies, CreateCommentInput, UpdateCommentInput } from '@/types/Comment';

/**
 * Get all visible comments for a question.
 * Returns private notes for the user and public comments if the question is shared.
 */
export const getCommentsForQuestion = async (
  questionId: string,
  userId: string
): Promise<CommentWithReplies[]> => {
  // Type assertion needed until types are regenerated after migration
  const { data: comments, error } = await supabase
    .from('question_comments' as any)
    .select(`
      id,
      question_id,
      user_id,
      content,
      is_private,
      parent_id,
      created_at,
      updated_at
    `)
    .eq('question_id', questionId)
    .order('created_at', { ascending: true }) as any;

  if (error) {
    console.error('Error fetching comments:', error);
    throw error;
  }

  if (!comments || comments.length === 0) {
    return [];
  }

  // Fetch user profiles for public comments
  const userIds = [...new Set((comments as any[]).map((c: any) => c.user_id))];
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, email, username')
    .in('id', userIds);

  const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

  // Map comments to include user info
  const commentsWithUser: CommentWithUser[] = (comments as any[]).map((comment: any) => {
    const profile = profileMap.get(comment.user_id);
    return {
      ...comment,
      user_email: profile?.email || null,
      user_name: profile?.username || profile?.email?.split('@')[0] || undefined,
    };
  });

  // Build threaded structure
  return buildThreadedComments(commentsWithUser);
};

/**
 * Build a hierarchical structure of comments with replies nested under parent comments.
 */
function buildThreadedComments(comments: CommentWithUser[]): CommentWithReplies[] {
  const commentMap = new Map<string, CommentWithReplies>();
  const rootComments: CommentWithReplies[] = [];

  // First pass: create all comment objects
  comments.forEach(comment => {
    commentMap.set(comment.id, {
      ...comment,
      replies: [],
    });
  });

  // Second pass: build the tree structure
  comments.forEach(comment => {
    const commentWithReplies = commentMap.get(comment.id)!;
    
    if (comment.parent_id) {
      // This is a reply, add it to parent's replies
      const parent = commentMap.get(comment.parent_id);
      if (parent) {
        parent.replies.push(commentWithReplies);
      }
    } else {
      // This is a root-level comment
      rootComments.push(commentWithReplies);
    }
  });

  return rootComments;
}

/**
 * Create a new comment or note.
 */
export const createComment = async (
  input: CreateCommentInput,
  userId: string
): Promise<Comment> => {
  const { data, error } = await supabase
    .from('question_comments' as any)
    .insert({
      question_id: input.question_id,
      user_id: userId,
      content: input.content.trim(),
      is_private: input.is_private,
      parent_id: input.parent_id || null,
    })
    .select()
    .single() as any;

  if (error) {
    console.error('Error creating comment:', error);
    throw error;
  }

  return data as Comment;
};

/**
 * Update an existing comment (only by the author).
 */
export const updateComment = async (
  commentId: string,
  userId: string,
  input: UpdateCommentInput
): Promise<Comment> => {
  const { data, error } = await supabase
    .from('question_comments' as any)
    .update({
      content: input.content.trim(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', commentId)
    .eq('user_id', userId) // Ensure only the author can update
    .select()
    .single() as any;

  if (error) {
    console.error('Error updating comment:', error);
    throw error;
  }

  if (!data) {
    throw new Error('Comment not found or you do not have permission to update it');
  }

  return data as Comment;
};

/**
 * Delete a comment (only by the author).
 */
export const deleteComment = async (
  commentId: string,
  userId: string
): Promise<void> => {
  const { error } = await supabase
    .from('question_comments' as any)
    .delete()
    .eq('id', commentId)
    .eq('user_id', userId) as any; // Ensure only the author can delete

  if (error) {
    console.error('Error deleting comment:', error);
    throw error;
  }
};

/**
 * Get question visibility to determine if public comments are allowed.
 */
export const getQuestionVisibility = async (questionId: string): Promise<'private' | 'university' | null> => {
  const { data, error } = await supabase
    .from('questions')
    .select('visibility')
    .eq('id', questionId)
    .single();

  if (error) {
    console.error('Error fetching question visibility:', error);
    return null;
  }

  return data?.visibility as 'private' | 'university' | null;
};

