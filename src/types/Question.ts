
export interface Question {
  id?: string;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  optionE: string;
  correctAnswer: string;
  comment?: string;
  subject: string;
  difficulty?: number;
  filename: string;
  userId?: string;
  visibility?: 'private' | 'university';
}
