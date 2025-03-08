// Define mockEqFn before it's used
const mockEqFn = jest.fn().mockReturnThis();

import { fetchQuestions, fetchTodayNewCount, fetchTodayPracticeCount, fetchTotalAnsweredCount, fetchTotalAttemptsCount } from '@/services/QuestionService';
import { supabase } from '@/integrations/supabase/client';
import { Question } from '@/types/Question';

// Mock the supabase client
jest.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: mockEqFn,
    gte: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
  }
}));

describe('QuestionService', () => {
  // Reset all mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchQuestions', () => {
    it('should fetch questions and map them correctly', async () => {
      // Mock response data
      const mockDbQuestions = [
        {
          id: '1',
          question: 'Test question?',
          option_a: 'A',
          option_b: 'B',
          option_c: 'C',
          option_d: 'D',
          option_e: 'E',
          subject: 'Test',
          correct_answer: 'A',
          comment: 'Test comment',
          filename: 'test.csv',
          difficulty: 3,
          created_at: '2023-01-01T00:00:00Z'
        }
      ];

      // Setup mock implementation
      (supabase.from as jest.Mock).mockImplementation(() => ({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: mockDbQuestions,
            error: null
          })
        })
      }));

      // Call the function
      const result = await fetchQuestions();

      // Verify the result
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1');
      expect(result[0].question).toBe('Test question?');
      expect(result[0].optionA).toBe('A');
      expect(result[0].correctAnswer).toBe('A');

      // Verify the supabase calls
      expect(supabase.from).toHaveBeenCalledWith('questions');
    });

    it('should handle errors when fetching questions', async () => {
      // Setup mock implementation with error
      (supabase.from as jest.Mock).mockImplementation(() => ({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database error' }
          })
        })
      }));

      // Call the function and expect it to throw
      await expect(fetchQuestions()).rejects.toThrow('Failed to fetch questions');
    });
  });

  describe('fetchTodayNewCount', () => {
    it('should return the count of new questions answered today', async () => {
      // Setup mock implementation
      (supabase.from as jest.Mock).mockImplementation(() => ({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            gte: jest.fn().mockResolvedValue({
              data: [{ id: '1' }, { id: '2' }],
              error: null
            })
          })
        })
      }));

      // Call the function
      const result = await fetchTodayNewCount('user1');

      // Verify the result
      expect(result).toBe(2);
    });
  });

  describe('fetchTodayPracticeCount', () => {
    it('should return the count of questions practiced today', async () => {
      // Setup mock implementation
      (supabase.from as jest.Mock).mockImplementation(() => ({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            gte: jest.fn().mockResolvedValue({
              data: [{ id: '1' }, { id: '2' }, { id: '3' }],
              error: null
            })
          })
        })
      }));

      // Call the function
      const result = await fetchTodayPracticeCount('user1');

      // Verify the result
      expect(result).toBe(3);
    });
  });

  describe('fetchTotalAnsweredCount', () => {
    it('should return the total count of answered questions', async () => {
      // Setup mock implementation
      (supabase.from as jest.Mock).mockImplementation(() => ({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            count: 10,
            error: null
          })
        })
      }));

      // Call the function
      const result = await fetchTotalAnsweredCount('user1');

      // Verify the result
      expect(result).toBe(10);
    });
  });

  describe('fetchTotalAttemptsCount', () => {
    it('should return the total count of attempts', async () => {
      // Setup mock implementation
      (supabase.from as jest.Mock).mockImplementation(() => ({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: [
              { attempts_count: 3 },
              { attempts_count: 2 },
              { attempts_count: null }
            ],
            error: null
          })
        })
      }));

      // Call the function
      const result = await fetchTotalAttemptsCount('user1');

      // Verify the result
      expect(result).toBe(6); // 3 + 2 + 1 (null defaults to 1)
    });
  });
});
