export type TrainingSessionStatus = 'active' | 'paused' | 'completed';

// Represents a persisted training session with an ordered set of questions
export interface TrainingSession {
  id: string;
  user_id: string;
  title: string;
  filter_settings: any; // stored as JSON (FormValues shape)
  question_ids: string[]; // ordered list of question IDs
  current_index: number; // 0-based index into question_ids
  total_questions: number; // denormalized for quick display
  status: TrainingSessionStatus;
  created_at: string;
  updated_at: string;
}

// Convenience type for creating a new session
export interface CreateTrainingSessionInput {
  title: string;
  filter_settings: any; // FormValues
  question_ids: string[];
}
