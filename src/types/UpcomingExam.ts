export interface UpcomingExam {
  id: string;
  title: string;
  due_date: string; // ISO date string
  description: string | null;
  subject: string | null;
  created_by: string;
  university_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface UpcomingExamWithStats extends UpcomingExam {
  linked_question_count: number;
}

export type QuestionSource = 'personal' | 'university';

export interface UpcomingExamQuestionLink {
  exam_id: string;
  question_id: string;
  source: QuestionSource;
  created_at: string;
}


