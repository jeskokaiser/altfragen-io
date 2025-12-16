export type ExamReconWorkspaceStatus = 'draft' | 'active' | 'published' | 'archived';

export type ExamReconMembershipRole = 'student' | 'moderator';

export type ExamReconSlotStatus =
  | 'unassigned'
  | 'assigned'
  | 'in_progress'
  | 'in_review'
  | 'complete'
  | 'auto_linked';

export type ExamReconTaskStatus =
  | 'unassigned'
  | 'assigned'
  | 'in_progress'
  | 'submitted'
  | 'done'
  | 'stale'
  | 'reassigned';

export type ExamReconQuestionType = 'unknown' | 'mcq' | 'free_text' | 'mixed';

export type ExamReconPresenceStatus = 'viewing' | 'editing';

export type ExamReconDraftContent = {
  prompt?: string;
  options?: { key: string; text: string }[];
  correct_answer?: string;
  solution_explanation?: string;
  tags?: string[];
  attachments?: { storage_path: string; caption?: string }[];
  source_notes?: string;
  confidence?: number;
};

export type ExamReconWorkspace = {
  id: string;
  university_id: string;
  title: string;
  subject: string;
  exam_term: string | null;
  exam_year: number | null;
  created_by: string;
  status: ExamReconWorkspaceStatus;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  due_at: string;
  dataset_filename: string;
  dataset_semester: string | null;
  dataset_year: string | null;
  dataset_subject: string | null;
};

export type ExamReconVariant = {
  id: string;
  workspace_id: string;
  code: string;
  display_name: string | null;
  question_count: number;
  created_at: string;
  updated_at: string;
};

export type ExamReconVariantSlot = {
  id: string;
  variant_id: string;
  slot_number: number;
  canonical_question_id: string | null;
  status: ExamReconSlotStatus;
  created_at: string;
  updated_at: string;
};

export type ExamReconCanonicalQuestion = {
  id: string;
  workspace_id: string;
  question_type: ExamReconQuestionType;
  normalized_prompt: string;
  prompt_hash: string | null;
  superseded_by: string | null;
  merge_reason: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type ExamReconQuestionDraft = {
  canonical_question_id: string;
  content: ExamReconDraftContent;
  revision: number;
  last_edited_by: string | null;
  updated_at: string;
};

export type ExamReconAssignmentTask = {
  id: string;
  workspace_id: string;
  slot_id: string;
  assigned_to: string | null;
  status: ExamReconTaskStatus;
  assigned_at: string | null;
  due_at: string | null;
  completed_at: string | null;
  reassigned_from: string | null;
  algorithm_run_id: string | null;
  created_at: string;
  updated_at: string;
};

export type ExamReconComment = {
  id: string;
  canonical_question_id: string;
  user_id: string;
  parent_id: string | null;
  content: string;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
};

export type ExamReconVote = {
  id: string;
  canonical_question_id: string;
  user_id: string;
  vote_kind: 'mcq' | 'free_text';
  mcq_choice: string | null;
  free_text_answer: string | null;
  created_at: string;
  updated_at: string;
};

export type ExamReconPresence = {
  id: string;
  workspace_id: string;
  canonical_question_id: string | null;
  user_id: string;
  status: ExamReconPresenceStatus;
  last_heartbeat_at: string;
  meta: Record<string, unknown>;
};

