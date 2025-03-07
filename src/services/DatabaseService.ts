
import { supabase } from '@/integrations/supabase/client';
import { Question } from '@/types/Question';

/**
 * Saves questions to the database
 * @param questions - The questions to save
 * @param userId - The ID of the user
 * @returns The saved questions
 */
export const saveQuestions = async (questions: Question[], userId: string): Promise<Question[]> => {
  const { error } = await supabase.from('questions').insert(
    questions.map(q => ({
      user_id: userId,
      question: q.question,
      option_a: q.optionA,
      option_b: q.optionB,
      option_c: q.optionC,
      option_d: q.optionD,
      option_e: q.optionE,
      subject: q.subject,
      correct_answer: q.correctAnswer,
      comment: q.comment,
      filename: q.filename,
      difficulty: q.difficulty
    }))
  );

  if (error) throw error;

  const { data: insertedQuestions, error: fetchError } = await supabase
    .from('questions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(questions.length);

  if (fetchError) throw fetchError;

  return insertedQuestions.map(q => ({
    id: q.id,
    question: q.question,
    optionA: q.option_a,
    optionB: q.option_b,
    optionC: q.option_c,
    optionD: q.option_d,
    optionE: q.option_e,
    subject: q.subject,
    correctAnswer: q.correct_answer,
    comment: q.comment,
    filename: q.filename,
    difficulty: q.difficulty,
  }));
};

/**
 * Updates a question in the database
 * @param question - The question to update
 * @returns The updated question
 */
export const updateQuestion = async (question: Question): Promise<Question> => {
  const { error } = await supabase
    .from('questions')
    .update({
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
    })
    .eq('id', question.id);

  if (error) throw error;
  return question;
};

/**
 * Marks a question as unclear in the database
 * @param questionId - The ID of the question
 * @param isUnclear - Whether the question is unclear
 * @returns A boolean indicating success
 */
export const markQuestionUnclear = async (questionId: string, isUnclear: boolean): Promise<boolean> => {
  const { error } = await supabase
    .from('questions')
    .update({
      is_unclear: isUnclear,
      marked_unclear_at: isUnclear ? new Date().toISOString() : null
    })
    .eq('id', questionId);

  if (error) throw error;
  return true;
};
