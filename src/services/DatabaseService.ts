
import { supabase } from '@/integrations/supabase/client';
import { Question } from '@/types/Question';

export const saveQuestions = async (questions: Question[], userId: string, visibility: 'private' | 'university' = 'private') => {
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
      difficulty: q.difficulty,
      visibility: visibility
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
    visibility: q.visibility as 'private' | 'university',
    created_at: q.created_at,
    is_unclear: q.is_unclear,
    marked_unclear_at: q.marked_unclear_at
  }));
};

export const getUniversityQuestions = async (universityId: string) => {
  const { data, error } = await supabase
    .from('questions')
    .select(`
      *,
      profiles:user_id (
        id
      )
    `)
    .eq('visibility', 'university')
    .eq('profiles.university_id', universityId);

  if (error) throw error;

  return data.map(q => ({
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
    userId: q.user_id,
    visibility: q.visibility as 'private' | 'university',
    created_at: q.created_at,
    is_unclear: q.is_unclear,
    marked_unclear_at: q.marked_unclear_at
  }));
};

// Function to update question visibility
export const updateQuestionVisibility = async (questionId: string, visibility: 'private' | 'university') => {
  const { error } = await supabase
    .from('questions')
    .update({ visibility })
    .eq('id', questionId);

  if (error) throw error;
  return true;
};
