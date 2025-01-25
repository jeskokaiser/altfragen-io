import { Question } from '@/types/Question';
import { supabase } from '@/integrations/supabase/client';
import { processBatches, insertQuestionsBatch } from './BatchService';

export const saveQuestions = async (questions: Question[], userId: string) => {
  await processBatches(questions, (batch) => insertQuestionsBatch(batch, userId));

  const { data: insertedQuestions, error: fetchError } = await supabase
    .from('questions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (fetchError) throw fetchError;

  return insertedQuestions;
};

export const fetchUserQuestions = async (userId: string) => {
  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};