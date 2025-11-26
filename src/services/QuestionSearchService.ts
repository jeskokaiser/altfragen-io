import { supabase } from '@/integrations/supabase/client';
import { Question } from '@/types/Question';
import { QuestionSearchOptions, QuestionSearchResult, SortField, SortDirection } from '@/types/QuestionSearchFilters';

export const searchQuestions = async (options: QuestionSearchOptions): Promise<QuestionSearchResult> => {
  const {
    searchText,
    filters,
    page = 0,
    pageSize = 50,
    sortBy = 'created_at',
    sortDirection = 'desc',
    userId,
    universityId
  } = options;

  const from = page * pageSize;
  const to = from + pageSize - 1;

  const questionColumns = `
    id,
    question,
    option_a,
    option_b,
    option_c,
    option_d,
    option_e,
    subject,
    correct_answer,
    comment,
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

  // Build queries for personal, university, and public questions
  const queries: Promise<any>[] = [];

  // Personal questions query
  let personalQuery = supabase
    .from('questions')
    .select(questionColumns, { count: 'exact' })
    .eq('user_id', userId);

  // University questions query
  let universityQuery = universityId
    ? supabase
        .from('questions')
        .select(questionColumns, { count: 'exact' })
        .eq('university_id', universityId)
        .eq('visibility', 'university')
        .neq('user_id', userId)
    : null;

  // Public questions query
  let publicQuery = supabase
    .from('questions')
    .select(questionColumns, { count: 'exact' })
    .eq('visibility', 'public')
    .neq('user_id', userId);

  // Apply full-text search if provided
  // Using ilike for pattern matching (case-insensitive)
  // Note: For better performance with large datasets, consider setting up a full-text search index
  if (searchText && searchText.trim()) {
    const searchTerm = `%${searchText.trim()}%`;
    personalQuery = personalQuery.ilike('question', searchTerm);
    if (universityQuery) {
      universityQuery = universityQuery.ilike('question', searchTerm);
    }
    publicQuery = publicQuery.ilike('question', searchTerm);
  }

  // Apply filters
  if (filters) {
    // Subject filter
    if (filters.subject) {
      personalQuery = personalQuery.eq('subject', filters.subject);
      if (universityQuery) {
        universityQuery = universityQuery.eq('subject', filters.subject);
      }
      publicQuery = publicQuery.eq('subject', filters.subject);
    }

    // Exam name (module) filter
    if (filters.examName) {
      personalQuery = personalQuery.eq('exam_name', filters.examName);
      if (universityQuery) {
        universityQuery = universityQuery.eq('exam_name', filters.examName);
      }
      publicQuery = publicQuery.eq('exam_name', filters.examName);
    }

    // Semester filter
    if (filters.semester) {
      personalQuery = personalQuery.eq('exam_semester', filters.semester);
      if (universityQuery) {
        universityQuery = universityQuery.eq('exam_semester', filters.semester);
      }
      publicQuery = publicQuery.eq('exam_semester', filters.semester);
    }

    // Year filter
    if (filters.year) {
      personalQuery = personalQuery.eq('exam_year', filters.year);
      if (universityQuery) {
        universityQuery = universityQuery.eq('exam_year', filters.year);
      }
      publicQuery = publicQuery.eq('exam_year', filters.year);
    }

    // Difficulty filter
    if (filters.difficulty !== null && filters.difficulty !== undefined) {
      personalQuery = personalQuery.eq('difficulty', filters.difficulty);
      if (universityQuery) {
        universityQuery = universityQuery.eq('difficulty', filters.difficulty);
      }
      publicQuery = publicQuery.eq('difficulty', filters.difficulty);
    }

    // Visibility filter
    if (filters.visibility && filters.visibility.length > 0) {
      personalQuery = personalQuery.in('visibility', filters.visibility);
      if (universityQuery) {
        universityQuery = universityQuery.in('visibility', filters.visibility);
      }
      publicQuery = publicQuery.in('visibility', filters.visibility);
    }

    // Filename filter
    if (filters.filename) {
      personalQuery = personalQuery.eq('filename', filters.filename);
      if (universityQuery) {
        universityQuery = universityQuery.eq('filename', filters.filename);
      }
      publicQuery = publicQuery.eq('filename', filters.filename);
    }
  }

  // Map sort field to database column name
  const getSortColumn = (field: SortField): string => {
    const columnMap: Record<SortField, string> = {
      'created_at': 'created_at',
      'subject': 'subject',
      'difficulty': 'difficulty',
      'exam_name': 'exam_name',
      'exam_year': 'exam_year'
    };
    return columnMap[field] || 'created_at';
  };

  const sortColumn = getSortColumn(sortBy);
  const ascending = sortDirection === 'asc';

  // Apply pagination and ordering
  personalQuery = personalQuery.order(sortColumn, { ascending }).range(from, to);
  if (universityQuery) {
    universityQuery = universityQuery.order(sortColumn, { ascending }).range(from, to);
  }
  publicQuery = publicQuery.order(sortColumn, { ascending }).range(from, to);

  // Execute queries
  const [personalResult, universityResult, publicResult] = await Promise.all([
    personalQuery,
    universityQuery || Promise.resolve({ data: [], error: null, count: 0 }),
    publicQuery
  ]);

  // Combine results
  const allQuestions: any[] = [];
  let totalCount = 0;

  if (!personalResult.error && personalResult.data) {
    allQuestions.push(...personalResult.data);
    totalCount += personalResult.count || 0;
  }

  if (universityResult && !universityResult.error && universityResult.data) {
    allQuestions.push(...universityResult.data);
    totalCount += universityResult.count || 0;
  }

  if (!publicResult.error && publicResult.data) {
    allQuestions.push(...publicResult.data);
    totalCount += publicResult.count || 0;
  }

  // Map to Question format
  const mappedQuestions: Question[] = allQuestions.map(q => ({
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
    exam_name: q.exam_name || null
  }));

  // Remove duplicates (in case a question matches multiple criteria)
  const uniqueQuestions = Array.from(
    new Map(mappedQuestions.map(q => [q.id, q])).values()
  );

  return {
    questions: uniqueQuestions,
    totalCount,
    page,
    pageSize,
    hasMore: uniqueQuestions.length === pageSize
  };
};

// Helper function to get distinct filter values
export const getFilterOptions = async (userId: string, universityId?: string | null) => {
  const queries: Promise<any>[] = [];

  // Get subjects
  const personalSubjectsQuery = supabase
    .from('questions')
    .select('subject')
    .eq('user_id', userId);

  const universitySubjectsQuery = universityId
    ? supabase
        .from('questions')
        .select('subject')
        .eq('university_id', universityId)
        .eq('visibility', 'university')
    : null;

  const publicSubjectsQuery = supabase
    .from('questions')
    .select('subject')
    .eq('visibility', 'public');

  // Get exam names
  const personalExamNamesQuery = supabase
    .from('questions')
    .select('exam_name')
    .eq('user_id', userId)
    .not('exam_name', 'is', null);

  const universityExamNamesQuery = universityId
    ? supabase
        .from('questions')
        .select('exam_name')
        .eq('university_id', universityId)
        .eq('visibility', 'university')
        .not('exam_name', 'is', null)
    : null;

  const publicExamNamesQuery = supabase
    .from('questions')
    .select('exam_name')
    .eq('visibility', 'public')
    .not('exam_name', 'is', null);

  // Get semesters
  const personalSemestersQuery = supabase
    .from('questions')
    .select('exam_semester')
    .eq('user_id', userId)
    .not('exam_semester', 'is', null);

  const universitySemestersQuery = universityId
    ? supabase
        .from('questions')
        .select('exam_semester')
        .eq('university_id', universityId)
        .eq('visibility', 'university')
        .not('exam_semester', 'is', null)
    : null;

  const publicSemestersQuery = supabase
    .from('questions')
    .select('exam_semester')
    .eq('visibility', 'public')
    .not('exam_semester', 'is', null);

  // Get years
  const personalYearsQuery = supabase
    .from('questions')
    .select('exam_year')
    .eq('user_id', userId)
    .not('exam_year', 'is', null);

  const universityYearsQuery = universityId
    ? supabase
        .from('questions')
        .select('exam_year')
        .eq('university_id', universityId)
        .eq('visibility', 'university')
        .not('exam_year', 'is', null)
    : null;

  const publicYearsQuery = supabase
    .from('questions')
    .select('exam_year')
    .eq('visibility', 'public')
    .not('exam_year', 'is', null);

  const [
    personalSubjects,
    universitySubjects,
    publicSubjects,
    personalExamNames,
    universityExamNames,
    publicExamNames,
    personalSemesters,
    universitySemesters,
    publicSemesters,
    personalYears,
    universityYears,
    publicYears
  ] = await Promise.all([
    personalSubjectsQuery,
    universitySubjectsQuery || Promise.resolve({ data: [], error: null }),
    publicSubjectsQuery,
    personalExamNamesQuery,
    universityExamNamesQuery || Promise.resolve({ data: [], error: null }),
    publicExamNamesQuery,
    personalSemestersQuery,
    universitySemestersQuery || Promise.resolve({ data: [], error: null }),
    publicSemestersQuery,
    personalYearsQuery,
    universityYearsQuery || Promise.resolve({ data: [], error: null }),
    publicYearsQuery
  ]);

  // Helper function to filter out empty/null values
  const filterValid = (value: any): value is string => {
    return value != null && typeof value === 'string' && value.trim() !== '';
  };

  // Combine and deduplicate
  const subjects = Array.from(
    new Set([
      ...(personalSubjects.data || []).map((q: any) => q.subject).filter(filterValid),
      ...(universitySubjects?.data || []).map((q: any) => q.subject).filter(filterValid),
      ...(publicSubjects.data || []).map((q: any) => q.subject).filter(filterValid)
    ])
  ).sort((a, b) => a.localeCompare(b, 'de'));

  const examNames = Array.from(
    new Set([
      ...(personalExamNames.data || []).map((q: any) => q.exam_name).filter(filterValid),
      ...(universityExamNames?.data || []).map((q: any) => q.exam_name).filter(filterValid),
      ...(publicExamNames.data || []).map((q: any) => q.exam_name).filter(filterValid)
    ])
  ).sort((a, b) => a.localeCompare(b, 'de'));

  const semesters = Array.from(
    new Set([
      ...(personalSemesters.data || []).map((q: any) => q.exam_semester).filter(filterValid),
      ...(universitySemesters?.data || []).map((q: any) => q.exam_semester).filter(filterValid),
      ...(publicSemesters.data || []).map((q: any) => q.exam_semester).filter(filterValid)
    ])
  ).sort();

  const years = Array.from(
    new Set([
      ...(personalYears.data || []).map((q: any) => q.exam_year).filter(filterValid),
      ...(universityYears?.data || []).map((q: any) => q.exam_year).filter(filterValid),
      ...(publicYears.data || []).map((q: any) => q.exam_year).filter(filterValid)
    ])
  ).sort((a, b) => b.localeCompare(a)); // Sort descending (newest first)

  return {
    subjects,
    examNames,
    semesters,
    years
  };
};

