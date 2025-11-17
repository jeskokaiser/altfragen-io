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
  
  // Select only essential columns for listing
  const questionColumns = `
    id,
    question,
    subject,
    filename,
    difficulty,
    is_unclear,
    marked_unclear_at,
    university_id,
    visibility,
    user_id,
    exam_semester,
    exam_year,
    exam_name,
    image_key,
    show_image_after_answer
  `;
  
  const { data, error } = await supabase
    .from('questions')
    .select(questionColumns)
    .eq('university_id', universityId)
    .eq('visibility', 'university')
    .order('created_at', { ascending: false });

  if (error) throw error;

  return data.map(q => ({
    id: q.id,
    question: q.question,
    optionA: '', // Load on demand
    optionB: '', // Load on demand
    optionC: '', // Load on demand
    optionD: '', // Load on demand
    optionE: '', // Load on demand
    subject: q.subject,
    correctAnswer: '', // Load on demand
    comment: '', // Load on demand
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
  // Select only the columns needed for dashboard display
  const questionColumns = `
    id,
    question,
    subject,
    filename,
    created_at,
    difficulty,
    is_unclear,
    marked_unclear_at,
    university_id,
    visibility,
    user_id,
    exam_semester,
    exam_year,
    exam_name,
    image_key,
    show_image_after_answer
  `;

  const { data: personalQuestions, error: personalError } = await supabase
    .from('questions')
    .select(questionColumns)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (personalError) throw personalError;

  let universityQuestions: any[] = [];
  if (universityId) {
    const { data: uniQuestions, error: uniError } = await supabase
      .from('questions')
      .select(questionColumns)
      .eq('university_id', universityId)
      .eq('visibility', 'university')
      .neq('user_id', userId) // Exclude questions created by the current user to avoid duplicates
      .order('created_at', { ascending: false });

    if (uniError) {
      throw uniError;
    }
    
    universityQuestions = uniQuestions || [];
  }

  // For now, skip fetching user difficulties in the dashboard to improve performance
  // User difficulties will be fetched on-demand when questions are actually displayed
  const allQuestions = [...personalQuestions, ...universityQuestions].map(q => ({
    id: q.id,
    question: q.question,
    optionA: '', // These will be loaded on-demand when needed
    optionB: '',
    optionC: '',
    optionD: '',
    optionE: '',
    subject: q.subject,
    correctAnswer: '', // Will be loaded on-demand
    comment: '', // Will be loaded on-demand
    filename: q.filename,
    created_at: q.created_at,
    difficulty: q.difficulty, // Use default difficulty, user-specific will be fetched on-demand
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

export const fetchAllQuestionsPaginated = async (
  userId: string, 
  universityId: string | null,
  page: number = 0,
  pageSize: number = 100
) => {
  const questionColumns = `
    id,
    question,
    subject,
    filename,
    created_at,
    difficulty,
    is_unclear,
    marked_unclear_at,
    university_id,
    visibility,
    user_id,
    exam_semester,
    exam_year,
    exam_name,
    image_key,
    show_image_after_answer
  `;

  const from = page * pageSize;
  const to = from + pageSize - 1;

  // Fetch personal questions with pagination
  const { data: personalQuestions, error: personalError, count: personalCount } = await supabase
    .from('questions')
    .select(questionColumns, { count: 'exact' })
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (personalError) throw personalError;

  let universityQuestions: any[] = [];
  let universityCount = 0;
  
  if (universityId && pageSize > (personalQuestions?.length || 0)) {
    // Calculate how many university questions we need
    const remainingSlots = pageSize - (personalQuestions?.length || 0);
    const universityFrom = Math.max(0, from - (personalCount || 0));
    const universityTo = universityFrom + remainingSlots - 1;

    const { data: uniQuestions, error: uniError, count: uniCount } = await supabase
      .from('questions')
      .select(questionColumns, { count: 'exact' })
      .eq('university_id', universityId)
      .eq('visibility', 'university')
      .neq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(universityFrom, universityTo);

    if (uniError) throw uniError;
    
    universityQuestions = uniQuestions || [];
    universityCount = uniCount || 0;
  }

  const allQuestions = [...personalQuestions || [], ...universityQuestions].map(q => ({
    id: q.id,
    question: q.question,
    optionA: '',
    optionB: '',
    optionC: '',
    optionD: '',
    optionE: '',
    subject: q.subject,
    correctAnswer: '',
    comment: '',
    filename: q.filename,
    created_at: q.created_at,
    difficulty: q.difficulty,
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

  return {
    questions: allQuestions,
    totalCount: (personalCount || 0) + universityCount,
    page,
    pageSize,
    hasMore: allQuestions.length === pageSize
  };
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

export const fetchUserDifficultiesForQuestions = async (userId: string, questionIds: string[]): Promise<Record<string, number>> => {
  if (!userId || questionIds.length === 0) return {};
  
  const userDifficulties: Record<string, number> = {};
  
  // Batch the question IDs to avoid URL length limits
  const BATCH_SIZE = 500;
  const batches = [];
  
  for (let i = 0; i < questionIds.length; i += BATCH_SIZE) {
    batches.push(questionIds.slice(i, i + BATCH_SIZE));
  }
  
  // Fetch all batches in parallel
  const batchPromises = batches.map(batch => 
    supabase
      .from('user_progress')
      .select('question_id, user_difficulty')
      .eq('user_id', userId)
      .in('question_id', batch)
      .not('user_difficulty', 'is', null)
  );
  
  try {
    const results = await Promise.all(batchPromises);
    const allProgressData = results.flatMap(result => result.data || []);
    
    // Combine all batch results
    allProgressData.forEach(item => {
      if (item.user_difficulty !== null) {
        userDifficulties[item.question_id] = item.user_difficulty;
      }
    });
  } catch (error) {
    console.error('Error fetching user difficulties:', error);
  }
  
  return userDifficulties;
};

export const fetchQuestionDetails = async (questionIds: string[]) => {
  if (!questionIds.length) return [];

  // Batch the question IDs to avoid URL length limits
  const BATCH_SIZE = 300;
  const batches: string[][] = [];
  
  for (let i = 0; i < questionIds.length; i += BATCH_SIZE) {
    batches.push(questionIds.slice(i, i + BATCH_SIZE));
  }

  // Fetch all batches in parallel
  const batchPromises = batches.map(batch =>
    supabase
      .from('questions')
      .select('*')
      .in('id', batch)
  );

  const results = await Promise.allSettled(batchPromises);
  
  // Check for any failed batches
  const failedBatches = results.filter(r => r.status === 'rejected');
  const succeededBatches = results.filter(r => r.status === 'fulfilled');
  
  if (failedBatches.length > 0) {
    console.error(`Failed to fetch ${failedBatches.length} of ${batches.length} question batches:`, 
      failedBatches.map((r: any) => r.reason)
    );
    
    // If all batches failed, throw an error
    if (failedBatches.length === batches.length) {
      throw new Error('Failed to fetch any question details. Please try again.');
    }
    
    // If more than 30% of batches failed, throw an error
    if (failedBatches.length / batches.length > 0.3) {
      throw new Error(
        `Failed to fetch ${failedBatches.length} of ${batches.length} question batches. ` +
        'Please check your connection and try again.'
      );
    }
  }
  
  // Check for Supabase errors in successful responses
  const batchesWithErrors = succeededBatches.filter((r: any) => r.value.error);
  if (batchesWithErrors.length > 0) {
    console.error(`Database errors in ${batchesWithErrors.length} batches:`, 
      batchesWithErrors.map((r: any) => r.value.error)
    );
    
    // If all successful requests have errors, throw
    if (batchesWithErrors.length === succeededBatches.length) {
      throw new Error('Database error while fetching questions. Please try again.');
    }
  }
  
  const allData = succeededBatches
    .filter((r: any) => !r.value.error)
    .flatMap((r: any) => r.value.data || []);

  return allData.map(q => ({
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
    difficulty: q.difficulty,
    is_unclear: q.is_unclear,
    marked_unclear_at: q.marked_unclear_at,
    university_id: q.university_id,
    visibility: (q.visibility as 'private' | 'university' | 'public') || 'private',
    user_id: q.user_id,
    semester: q.exam_semester || null,
    year: q.exam_year || null,
    image_key: q.image_key || null,
    show_image_after_answer: q.show_image_after_answer || false,
    exam_name: q.exam_name || null,
    
    // Answer distribution statistics
    first_answer_stats: q.first_answer_stats || null,
    first_answer_stats_updated_at: q.first_answer_stats_updated_at || null,
    first_answer_sample_size: q.first_answer_sample_size || 0
  }));
};
