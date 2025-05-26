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
      visibility: q.visibility || 'private',
      exam_semester: q.semester || null,
      exam_year: q.year || null,
      image_key: q.image_key || null,
      show_image_after_answer: q.show_image_after_answer || false,
      exam_name: q.exam_name || null
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
    visibility: (q.visibility as 'private' | 'university') || 'private',
    semester: q.exam_semester || null,
    year: q.exam_year || null,
    image_key: q.image_key || null,
    show_image_after_answer: q.show_image_after_answer || false,
    exam_name: q.exam_name || null
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
    user_id: q.user_id,
    semester: q.exam_semester || null,
    year: q.exam_year || null,
    image_key: q.image_key || null,
    show_image_after_answer: q.show_image_after_answer || false,
    exam_name: q.exam_name || null
  }));
};

export const updateQuestionVisibility = async (questionId: string, visibility: 'private' | 'university', universityId?: string | null) => {
  const { data: existingQuestion } = await supabase
    .from('questions')
    .select('visibility')
    .eq('id', questionId)
    .single();
  
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
  const { data: existingQuestions } = await supabase
    .from('questions')
    .select('visibility')
    .eq('filename', filename)
    .eq('user_id', userId)
    .eq('visibility', 'university');
  
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

export const fetchAllQuestions = async (userId: string, universityId?: string | null) => {
  const { data: personalQuestions, error: personalError } = await supabase
    .from('questions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (personalError) throw personalError;

  let universityQuestions: any[] = [];
  if (universityId) {
    const { data: uniQuestions, error: uniError } = await supabase
      .from('questions')
      .select('*')
      .eq('university_id', universityId)
      .eq('visibility', 'university')
      .order('created_at', { ascending: false });

    if (uniError) throw uniError;
    universityQuestions = uniQuestions || [];
  }

  const allQuestionsIds = [...personalQuestions, ...universityQuestions].map(q => q.id);
  let userDifficulties: Record<string, number> = {};
  
  if (allQuestionsIds.length > 0) {
    const { data: progressData, error: progressError } = await supabase
      .from('user_progress')
      .select('question_id, user_difficulty')
      .eq('user_id', userId)
      .in('question_id', allQuestionsIds)
      .not('user_difficulty', 'is', null);
    
    if (!progressError && progressData) {
      userDifficulties = progressData.reduce((acc: Record<string, number>, item) => {
        if (item.user_difficulty !== null) {
          acc[item.question_id] = item.user_difficulty;
        }
        return acc;
      }, {});
    }
  }

  const allQuestions = [...personalQuestions, ...universityQuestions].map(q => ({
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
    created_at: q.created_at,
    difficulty: q.id in userDifficulties ? userDifficulties[q.id] : q.difficulty,
    is_unclear: q.is_unclear,
    marked_unclear_at: q.marked_unclear_at,
    university_id: q.university_id,
    visibility: (q.visibility as 'private' | 'university' | 'public') || 'private',
    user_id: q.user_id,
    semester: q.exam_semester || null,
    year: q.exam_year || null,
    image_key: q.image_key || null,
    show_image_after_answer: q.show_image_after_answer || false,
    exam_name: q.exam_name || null
  }));

  return allQuestions;
};

export const fetchUserDifficulty = async (userId: string, questionId: string): Promise<number | null> => {
  if (!userId || !questionId) return null;
  
  const { data, error } = await supabase
    .from('user_progress')
    .select('user_difficulty')
    .eq('user_id', userId)
    .eq('question_id', questionId)
    .maybeSingle();
  
  if (error || !data) return null;
  
  return data.user_difficulty;
};
