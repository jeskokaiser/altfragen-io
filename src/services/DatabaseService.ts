
import { supabase } from '@/integrations/supabase/client';
import { Question } from '@/types/Question';

export const saveQuestions = async (questions: Question[], userId: string, universityId?: string | null) => {
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
      university_id: q.visibility === 'university' ? universityId : null,
      visibility: q.visibility || 'private'
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
    is_unclear: q.is_unclear,
    marked_unclear_at: q.marked_unclear_at,
    university_id: q.university_id,
    visibility: (q.visibility as 'private' | 'university') || 'private'
  }));
};

export const fetchUniversityQuestions = async (universityId: string) => {
  if (!universityId) return [];
  
  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .eq('university_id', universityId)
    .eq('visibility', 'university')
    .order('created_at', { ascending: false });

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
    is_unclear: q.is_unclear,
    marked_unclear_at: q.marked_unclear_at,
    university_id: q.university_id,
    visibility: (q.visibility as 'private' | 'university') || 'private',
    user_id: q.user_id
  }));
};

// Removed fetchPublicQuestions function since we no longer support public visibility

export const updateQuestionVisibility = async (questionId: string, visibility: 'private' | 'university', universityId?: string | null) => {
  // First check if this question is already shared with university
  const { data: existingQuestion } = await supabase
    .from('questions')
    .select('visibility')
    .eq('id', questionId)
    .single();
  
  // If question is already shared with university, don't allow changing back to private
  if (existingQuestion?.visibility === 'university' && visibility === 'private') {
    throw new Error('Fragen, die mit deiner Universität geteilt wurden, können nicht zurück auf privat gesetzt werden.');
  }

  const { error } = await supabase
    .from('questions')
    .update({ 
      visibility,
      university_id: visibility === 'university' ? universityId : null 
    })
    .eq('id', questionId);

  if (error) throw error;
  return true;
};

export const updateDatasetVisibility = async (filename: string, userId: string, visibility: 'private' | 'university', universityId?: string | null) => {
  // First check if any questions in this dataset are already shared with university
  const { data: existingQuestions } = await supabase
    .from('questions')
    .select('visibility')
    .eq('filename', filename)
    .eq('user_id', userId)
    .eq('visibility', 'university');
  
  // If trying to change university questions back to private
  if (existingQuestions && existingQuestions.length > 0 && visibility === 'private') {
    throw new Error('Fragen, die mit deiner Universität geteilt wurden, können nicht zurück auf privat gesetzt werden.');
  }

  const { error } = await supabase
    .from('questions')
    .update({ 
      visibility,
      university_id: visibility === 'university' ? universityId : null 
    })
    .eq('filename', filename)
    .eq('user_id', userId);

  if (error) throw error;
  return true;
};
