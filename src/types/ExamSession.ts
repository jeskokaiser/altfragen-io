
export interface ExamSession {
  id: string;
  title: string;
  description: string | null;
  creator_id: string;
  university_id: string | null;
  subject: string;
  semester: string | null;
  year: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SessionParticipant {
  id: string;
  session_id: string;
  user_id: string;
  role: 'host' | 'participant';
  joined_at: string;
}

export interface DraftQuestion {
  id: string;
  session_id: string;
  creator_id: string;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  option_e: string;
  correct_answer: 'A' | 'B' | 'C' | 'D' | 'E';
  comment: string | null;
  difficulty: number;
  status: 'draft' | 'reviewed' | 'published';
  created_at: string;
  updated_at: string;
}

// This interface is used to type-cast the Supabase response for session_activities table
export interface SessionActivityDb {
  id: string;
  session_id: string;
  user_id: string;
  activity_type: 'join' | 'leave' | 'create' | 'update' | 'delete' | 'review' | 'publish';
  message: string;
  entity_id: string | null;
  created_at: string;
}

// This is the interface we use in our components
export interface SessionActivity {
  id: string;
  session_id: string;
  user_id: string;
  activity_type: 'join' | 'leave' | 'create' | 'update' | 'delete' | 'review' | 'publish';
  message: string;
  entity_id?: string;
  created_at: string;
}

// This interface defines the structure of the Supabase presence state
export interface PresenceUserState {
  user_id: string;
  online_at: string;
  [key: string]: any;
}

export interface PresenceState {
  [key: string]: PresenceUserState[];
}

// Define a more specific type for the active users object used in the UI
export interface ActiveUserInfo {
  online_at: string;
  presence_ref: string;
}

// Type for our QuestionCard active users prop
export interface QuestionCardActiveUsers {
  [key: string]: {
    lastActive: string;
  };
}
