export interface Question {
  id: string;  // Unique identifier for the question
  question: string;  // Frage
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  optionE: string;
  subject: string;  // Fach
  correctAnswer: string;  // Antwort
  comment: string;  // Kommentar
}