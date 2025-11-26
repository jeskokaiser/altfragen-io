export interface QuestionSearchFilters {
  subject?: string | null;
  examName?: string | null; // module
  semester?: string | null;
  year?: string | null;
  difficulty?: number | null;
  visibility?: ('private' | 'university' | 'public')[] | null;
  filename?: string | null;
}

export type SortField = 'created_at' | 'subject' | 'difficulty' | 'exam_name' | 'exam_year';
export type SortDirection = 'asc' | 'desc';

export interface QuestionSearchOptions {
  searchText?: string;
  filters?: QuestionSearchFilters;
  page?: number;
  pageSize?: number;
  sortBy?: SortField;
  sortDirection?: SortDirection;
  userId: string;
  universityId?: string | null;
}

export interface QuestionSearchResult {
  questions: any[]; // Question[]
  totalCount: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

