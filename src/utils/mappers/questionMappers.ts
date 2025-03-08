
import { Question } from '@/types/Question';

/**
 * Maps a database question object to a Question domain object
 */
export const mapDatabaseQuestionToQuestion = (dbQuestion: any): Question => {
  return {
    id: dbQuestion.id,
    question: dbQuestion.question,
    optionA: dbQuestion.option_a,
    optionB: dbQuestion.option_b,
    optionC: dbQuestion.option_c,
    optionD: dbQuestion.option_d,
    optionE: dbQuestion.option_e,
    subject: dbQuestion.subject,
    correctAnswer: dbQuestion.correct_answer,
    comment: dbQuestion.comment,
    filename: dbQuestion.filename,
    created_at: dbQuestion.created_at,
    difficulty: dbQuestion.difficulty,
    is_unclear: dbQuestion.is_unclear,
    marked_unclear_at: dbQuestion.marked_unclear_at
  };
};

/**
 * Maps a Question domain object to a database question object for insertion/update
 */
export const mapQuestionToDatabaseQuestion = (question: Question, userId?: string): Record<string, any> => {
  const dbQuestion: Record<string, any> = {
    question: question.question,
    option_a: question.optionA,
    option_b: question.optionB,
    option_c: question.optionC,
    option_d: question.optionD,
    option_e: question.optionE,
    subject: question.subject,
    correct_answer: question.correctAnswer,
    comment: question.comment,
    difficulty: question.difficulty
  };

  // Only include these fields for new questions
  if (userId) {
    dbQuestion.user_id = userId;
    dbQuestion.filename = question.filename;
  }

  return dbQuestion;
};
