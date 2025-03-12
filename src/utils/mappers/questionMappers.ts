
import { Question } from '@/types/models/Question';
import { DatabaseQuestion } from '@/types/api/database';

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
    marked_unclear_at: dbQuestion.marked_unclear_at,
    visibility: dbQuestion.visibility,
    university_id: dbQuestion.university_id
  };
};

/**
 * Maps a Question domain object to a database question object for insertion/update
 */
export const mapQuestionToDatabaseQuestion = (question: Question, userId?: string): DatabaseQuestion => {
  const dbQuestion: DatabaseQuestion = {
    question: question.question,
    option_a: question.optionA,
    option_b: question.optionB,
    option_c: question.optionC,
    option_d: question.optionD,
    option_e: question.optionE,
    subject: question.subject,
    correct_answer: question.correctAnswer,
    comment: question.comment,
    difficulty: question.difficulty,
    filename: question.filename,
    visibility: question.visibility || 'private',
    university_id: question.university_id
  };

  // Only include user_id for new questions
  if (userId) {
    dbQuestion.user_id = userId;
  }

  return dbQuestion;
};
