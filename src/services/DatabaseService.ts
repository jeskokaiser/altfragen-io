
import { supabase } from '@/integrations/supabase/client';
import { Question } from '@/types/Question';

export const saveQuestions = async (questions: Question[], userId: string) => {
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

export const updateQuestion = async (question: Question) => {
  const { data, error } = await supabase
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
      difficulty: question.difficulty,
    })
    .eq('id', question.id)
    .select()
    .single();

  if (error) throw error;

  return {
    ...question,
    ...data,
    optionA: data.option_a,
    optionB: data.option_b,
    optionC: data.option_c,
    optionD: data.option_d,
    optionE: data.option_e,
    correctAnswer: data.correct_answer,
  };
};

export const markQuestionUnclear = async (questionId: string) => {
  const { error } = await supabase
    .from('questions')
    .update({
      is_unclear: true,
      marked_unclear_at: new Date().toISOString(),
    })
    .eq('id', questionId);

  if (error) throw error;
};

export const saveQuestionProgress = async (
  userId: string,
  questionId: string,
  userAnswer: string,
  isCorrect: boolean
) => {
  const { error } = await supabase
    .from('user_progress')
    .insert({
      user_id: userId,
      question_id: questionId,
      user_answer: userAnswer,
      is_correct: isCorrect
    });

  if (error) throw error;
};

export const updateQuestionProgress = async (
  userId: string,
  questionId: string,
  userAnswer: string,
  isCorrect: boolean
) => {
  const { error } = await supabase
    .from('user_progress')
    .update({
      user_answer: userAnswer,
      is_correct: isCorrect
    })
    .eq('user_id', userId)
    .eq('question_id', questionId);

  if (error) throw error;
};
