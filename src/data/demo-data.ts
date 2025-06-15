import { Question } from '@/types/Question';
import { AICommentaryData } from '@/types/AIAnswerComments';

export const demoQuestions: Question[] = [
  {
    id: 'demo-1',
    question: 'What is the capital of France?',
    optionA: 'Berlin',
    optionB: 'Madrid',
    optionC: 'Paris',
    optionD: 'Rome',
    optionE: null,
    correctAnswer: 'C',
    comment: 'A classic geography question.',
    subject: 'Geography',
    exam_name: 'Demo Exam',
    filename: 'demo.csv',
    year: '2025',
    semester: 'SS',
    user_id: 'demo-user',
    created_at: new Date().toISOString(),
    is_unclear: false,
    marked_unclear_at: null,
    difficulty: 1,
    visibility: 'public',
  },
  {
    id: 'demo-2',
    question: 'Which planet is known as the Red Planet?',
    optionA: 'Earth',
    optionB: 'Mars',
    optionC: 'Jupiter',
    optionD: 'Saturn',
    optionE: null,
    correctAnswer: 'B',
    comment: 'This planet has a reddish appearance due to iron oxide on its surface.',
    subject: 'Astronomy',
    exam_name: 'Demo Exam',
    filename: 'demo.csv',
    year: '2025',
    semester: 'SS',
    user_id: 'demo-user',
    created_at: new Date().toISOString(),
    is_unclear: false,
    marked_unclear_at: null,
    difficulty: 2,
    visibility: 'public',
  },
  {
    id: 'demo-3',
    question: 'What is the largest mammal in the world?',
    optionA: 'Elephant',
    optionB: 'Blue Whale',
    optionC: 'Giraffe',
    optionD: 'Great White Shark',
    optionE: null,
    correctAnswer: 'B',
    comment: 'It is the largest animal known to have ever existed.',
    subject: 'Biology',
    exam_name: 'Demo Exam',
    filename: 'demo.csv',
    year: '2025',
    semester: 'SS',
    user_id: 'demo-user',
    created_at: new Date().toISOString(),
    is_unclear: false,
    marked_unclear_at: null,
    difficulty: 2,
    visibility: 'public',
  },
];

export const demoAiCommentaries: Record<string, AICommentaryData> = {
  'demo-1': {
    summary: {
      id: 'demo-summary-1',
      question_id: 'demo-1',
      summary_general_comment: "This question tests basic knowledge of European capitals. Paris is a major global center for art, fashion, gastronomy and culture.",
      summary_comment_a: "Berlin is the capital of Germany.",
      summary_comment_b: "Madrid is the capital of Spain.",
      summary_comment_c: "Correct. Paris has been the capital of France for more than 1,500 years.",
      summary_comment_d: "Rome is the capital of Italy.",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    models: {
      openai: { answers: {} },
      claude: { answers: {} },
      gemini: { answers: {} },
    }
  },
  'demo-2': {
    summary: {
      id: 'demo-summary-2',
      question_id: 'demo-2',
      summary_general_comment: "This question is about the planets in our solar system. The distinct color of Mars makes this a common knowledge question in astronomy.",
      summary_comment_a: "Earth is known as the 'Blue Planet' due to its vast oceans.",
      summary_comment_b: "Correct. Mars is called the Red Planet because of the prevalence of iron oxide (rust) on its surface, which gives it a reddish hue.",
      summary_comment_c: "Jupiter is a gas giant, known for its Great Red Spot, but it is not called the Red Planet.",
      summary_comment_d: "Saturn is known for its prominent ring system.",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    models: {
      openai: { answers: {} },
      claude: { answers: {} },
      gemini: { answers: {} },
    }
  },
  'demo-3': {
    summary: {
      id: 'demo-summary-3',
      question_id: 'demo-3',
      summary_general_comment: "This question assesses knowledge of animal superlatives. It requires distinguishing between large land mammals and marine mammals.",
      summary_comment_a: "The African Elephant is the largest land animal, but not the largest mammal overall.",
      summary_comment_b: "Correct. The Blue Whale is the largest animal on Earth, both in terms of length and weight.",
      summary_comment_c: "The Giraffe is the tallest land animal, but not the largest in terms of mass.",
      summary_comment_d: "The Great White Shark is a large fish, but not a mammal.",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    models: {
      openai: { answers: {} },
      claude: { answers: {} },
      gemini: { answers: {} },
    }
  }
};
