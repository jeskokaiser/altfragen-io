export interface Question {
  id: string;  // Added this field
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  optionE: string;
  subject: string;
  correctAnswer: string;
  comment: string;
}