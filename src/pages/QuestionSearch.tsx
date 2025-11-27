import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SearchFilters } from '@/components/questions/SearchFilters';
import { SearchResultsList } from '@/components/questions/SearchResultsList';
import { searchQuestions, getFilterOptions } from '@/services/QuestionSearchService';
import { QuestionSearchFilters, SortField, SortDirection } from '@/types/QuestionSearchFilters';
import { Question } from '@/types/Question';
import { useAuth } from '@/contexts/AuthContext';
import { Search, Loader2, ArrowUpDown } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

// Simple debounce hook
const useDebounce = <T,>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

const QuestionSearch: React.FC = () => {
  const { user, universityId } = useAuth();
  const [searchText, setSearchText] = useState('');
  const [filters, setFilters] = useState<QuestionSearchFilters>({
    subject: null,
    examName: null,
    semester: null,
    year: null,
    difficulty: null,
    visibility: null,
    filename: null
  });
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(50);
  const [sortBy, setSortBy] = useState<SortField>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const debouncedSearchText = useDebounce(searchText, 300);

  // Fetch filter options
  const { data: filterOptions, isLoading: isLoadingOptions } = useQuery({
    queryKey: ['search-filter-options', user?.id, universityId],
    queryFn: () => getFilterOptions(user!.id, universityId || null),
    enabled: !!user
  });

  // Search questions
  const { data: searchResults, isLoading: isLoadingResults, refetch } = useQuery({
    queryKey: ['question-search', debouncedSearchText, filters, page, pageSize, sortBy, sortDirection, user?.id, universityId],
    queryFn: () => searchQuestions({
      searchText: debouncedSearchText,
      filters,
      page,
      pageSize,
      sortBy,
      sortDirection,
      userId: user!.id,
      universityId: universityId || null
    }),
    enabled: !!user,
    staleTime: 30000 // Cache for 30 seconds
  });

  const handleFiltersChange = (newFilters: QuestionSearchFilters) => {
    setFilters(newFilters);
    setPage(0); // Reset to first page when filters change
  };

  const handlePageSizeChange = (newPageSize: string) => {
    setPageSize(Number(newPageSize));
    setPage(0); // Reset to first page when page size changes
  };

  const handleSortChange = (field: SortField) => {
    // If clicking the same field, toggle direction; otherwise set to desc
    if (field === sortBy) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDirection('desc');
    }
    setPage(0); // Reset to first page when sort changes
  };

  const handleQuestionUpdated = (updatedQuestion: Question) => {
    // Refetch search results to reflect the update
    refetch();
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    // Scroll to top of results
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const totalPages = searchResults
    ? Math.ceil(searchResults.totalCount / pageSize)
    : 0;

  const isLoading = isLoadingResults || isLoadingOptions;

  return (
    <div className="container mx-auto py-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Fragen suchen
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Frage durchsuchen..."
              value={searchText}
              onChange={(e) => {
                setSearchText(e.target.value);
                setPage(0); // Reset to first page when search text changes
              }}
              className="pl-10"
            />
          </div>

          {/* Filters */}
          {filterOptions && (
            <SearchFilters
              filters={filters}
              onFiltersChange={handleFiltersChange}
              filterOptions={filterOptions}
            />
          )}

          {/* Results Count and Controls */}
          {searchResults && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <p className="text-sm text-muted-foreground">
                {searchResults.totalCount === 0
                  ? 'Keine Ergebnisse gefunden'
                  : `${searchResults.totalCount} Frage${searchResults.totalCount !== 1 ? 'n' : ''} gefunden`}
              </p>
              <div className="flex items-center gap-4">
                {isLoading && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Lade Ergebnisse...</span>
                  </div>
                )}
                {/* Sort Options */}
                <div className="flex items-center gap-2">
                  <Label htmlFor="sort-by" className="text-sm whitespace-nowrap">Sortieren nach:</Label>
                  <Select
                    value={sortBy}
                    onValueChange={(value) => handleSortChange(value as SortField)}
                  >
                    <SelectTrigger id="sort-by" className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="created_at">Erstellungsdatum</SelectItem>
                      <SelectItem value="subject">Fach</SelectItem>
                      <SelectItem value="difficulty">Schwierigkeit</SelectItem>
                      <SelectItem value="exam_name">Modul/Prüfung</SelectItem>
                      <SelectItem value="exam_year">Jahr</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
                    title={sortDirection === 'asc' ? 'Aufsteigend' : 'Absteigend'}
                  >
                    <ArrowUpDown className={`h-4 w-4 ${sortDirection === 'asc' ? 'rotate-180' : ''}`} />
                  </Button>
                </div>
                {/* Page Size Selector */}
                <div className="flex items-center gap-2">
                  <Label htmlFor="page-size" className="text-sm whitespace-nowrap">Pro Seite:</Label>
                  <Select
                    value={pageSize.toString()}
                    onValueChange={handlePageSizeChange}
                  >
                    <SelectTrigger id="page-size" className="w-[100px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                      <SelectItem value="200">200</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* Search Results */}
          {searchResults && (
            <>
              <SearchResultsList
                questions={searchResults.questions}
                onQuestionUpdated={handleQuestionUpdated}
                isLoading={isLoading}
              />

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center pt-4">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => page > 0 && handlePageChange(page - 1)}
                          className={page === 0 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                      {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => {
                        // Show page numbers around current page
                        let pageNum: number;
                        if (totalPages <= 10) {
                          pageNum = i;
                        } else if (page < 5) {
                          pageNum = i;
                        } else if (page > totalPages - 6) {
                          pageNum = totalPages - 10 + i;
                        } else {
                          pageNum = page - 5 + i;
                        }

                        return (
                          <PaginationItem key={pageNum}>
                            <PaginationLink
                              onClick={() => handlePageChange(pageNum)}
                              isActive={pageNum === page}
                              className="cursor-pointer"
                            >
                              {pageNum + 1}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      })}
                      <PaginationItem>
                        <PaginationNext
                          onClick={() => page < totalPages - 1 && handlePageChange(page + 1)}
                          className={page >= totalPages - 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}

          {/* Empty State - No search performed yet */}
          {!searchResults && !isLoading && (
            <div className="text-center py-12">
              <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Gib einen Suchbegriff ein oder verwende die Filter, um Fragen zu finden.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default QuestionSearch;

