export interface Comment {
  id: string;
  question_id: string;
  user_id: string;
  content: string;
  is_private: boolean;
  parent_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface CommentWithUser extends Comment {
  user_name?: string; // the profile's username, if the author set one
}

export interface CommentWithReplies extends CommentWithUser {
  replies: CommentWithReplies[];
}

// For creating a new comment
export interface CreateCommentInput {
  question_id: string;
  content: string;
  is_private: boolean;
  parent_id?: string | null;
}

// For updating a comment
export interface UpdateCommentInput {
  content: string;
}
