import { supabase } from '@/integrations/supabase/client';

export interface Dataset {
  exam_name: string;
  question_count: number;
  user_ids: string[];
}

/**
 * Fetches all unique exam_name values from university questions with university visibility.
 */
export const getUniversityDatasets = async (universityId: string): Promise<Dataset[]> => {
  if (!universityId) return [];

  // Fetch all university questions with exam_name
  const { data: questions, error } = await supabase
    .from('questions')
    .select('id, exam_name, user_id')
    .eq('university_id', universityId)
    .eq('visibility', 'university')
    .not('exam_name', 'is', null);

  if (error) throw error;
  if (!questions || questions.length === 0) return [];

  // Group questions by unique exam_name
  const datasetMap = new Map<string, Dataset>();

  for (const q of questions) {
    const examName = q.exam_name as string;
    
    if (!examName) continue;

    if (!datasetMap.has(examName)) {
      datasetMap.set(examName, {
        exam_name: examName,
        question_count: 0,
        user_ids: [],
      });
    }

    const dataset = datasetMap.get(examName)!;
    dataset.question_count += 1;
    if (q.user_id && !dataset.user_ids.includes(q.user_id)) {
      dataset.user_ids.push(q.user_id);
    }
  }

  return Array.from(datasetMap.values()).sort((a, b) => {
    // Sort alphabetically by exam_name
    return a.exam_name.localeCompare(b.exam_name);
  });
};

