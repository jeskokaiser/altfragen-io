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
      filename: q.filename
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
    created_at: q.created_at
  }));
};