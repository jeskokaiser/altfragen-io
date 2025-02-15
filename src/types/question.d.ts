
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
}

export interface QuestionViewProps {
  questionData: Question;
  totalQuestions: number;
  currentIndex: number;
  onNext: () => void;
  onPrevious: () => void;
  onAnswer: (answer: string) => void;
  userAnswer: string;
  onQuit: () => void;
  onQuestionUpdate?: (updatedQuestion: Question) => void;
}

export interface QuestionHeaderProps {
  currentIndex: number;
  totalQuestions: number;
  onQuit: () => void;
}

export interface QuestionContentProps {
  questionData: Question;
  selectedAnswer: string;
  onAnswerChange: (answer: string) => void;
  onConfirmAnswer: () => void;
  showFeedback: boolean;
}

export interface FormData {
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  optionE: string;
  correctAnswer: string;
  comment: string;
  subject: string;
  difficulty: string;
}
