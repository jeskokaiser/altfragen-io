import { Question } from '@/types/Question';
import { supabase } from '@/integrations/supabase/client';

const BATCH_SIZE = 500;

export const processBatches = async <T>(
  items: T[],
  processFn: (batch: T[]) => Promise<void>
) => {
  const batches = [];
  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const batch = items.slice(i, i + BATCH_SIZE);
    batches.push(batch);
  }

  for (const batch of batches) {
    await processFn(batch);
  }
};

export const insertQuestionsBatch = async (
  questions: Question[],
  userId: string
) => {
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
};