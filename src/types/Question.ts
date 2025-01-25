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
  created_at?: string;
}