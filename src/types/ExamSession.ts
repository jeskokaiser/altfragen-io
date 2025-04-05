export interface ExamSession {
  id: string;
  title: string;
  description: string;
  subject: string;
  semester: string | null;
  year: string | null;
  creator_id: string;
  university_id: string | null;
  created_at: string;
  is_active: boolean;
}

export interface SessionParticipant {
  id: string;
  session_id: string;
  user_id: string;
  role: 'host' | 'participant';
  created_at: string;
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
  comment: string;
  difficulty: number;
  status: 'draft' | 'reviewed' | 'published';
  created_at: string;
}

export interface SessionActivityDb {
  id: string;
  session_id: string;
  user_id: string;
  activity_type: string;
  message: string;
  entity_id: string | null;
  created_at: string;
}

export interface SessionActivity {
  id: string;
  session_id: string;
  user_id: string;
  activity_type: string;
  message: string;
  entity_id?: string;
  created_at: string;
}

export interface ActiveUserInfo {
  online_at: string;
  presence_ref: string;
}

export interface QuestionCardActiveUsers {
  [userId: string]: {
    lastActive: string;
  };
}
