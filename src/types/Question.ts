
export interface Question {
  id: string;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  optionE: string;
  subject: string;
  correctAnswer: string;
  comment: string;
  filename: string;
  created_at?: string;
  difficulty: number;
  is_unclear?: boolean;
  marked_unclear_at?: string;
  university_id?: string | null;
  visibility?: 'private' | 'university' | 'public';
  user_id?: string | null;
  semester?: string | null;
  year?: string | null;
  image_key?: string | null;
}

export interface PdfProcessingTask {
  task_id: string;
  status: 'processing' | 'completed' | 'failed';
  message?: string;
}
