
import { fetchQuestions, fetchTodayNewCount, fetchTodayPracticeCount, 
         fetchTotalAnsweredCount, fetchTotalAttemptsCount } from '@/services/QuestionService';
import { supabase } from '@/integrations/supabase/client';
import { AppError } from '@/utils/errorHandler';

// Mock the supabase client
jest.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
  }
}));

describe('QuestionService', () => {
  // Reset all mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchQuestions', () => {
    it('should fetch questions and map them correctly', async () => {
      // Mock the Supabase response
      const mockData = [
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
          created_at: '2023-01-01',
          difficulty: 3,
          is_unclear: false,
          marked_unclear_at: null
        }
      ];
      
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({ data: mockData, error: null })
        })
      });

      // Call the function
      const result = await fetchQuestions();

      // Verify the result
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1');
      expect(result[0].question).toBe('Test question?');
      expect(result[0].optionA).toBe('A');
      expect(result[0].correctAnswer).toBe('A');
      expect(result[0].filename).toBe('test.csv');

      // Verify that the Supabase client was called correctly
      expect(supabase.from).toHaveBeenCalledWith('questions');
    });

    it('should throw an error if the Supabase query fails', async () => {
      // Mock the Supabase response with an error
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({ 
            data: null, 
            error: new Error('Database error') 
          })
        })
      });

      // Call the function and expect it to throw
      await expect(fetchQuestions()).rejects.toThrow('Failed to fetch questions');
    });
    
    it('should return an empty array if no data is returned', async () => {
      // Mock the Supabase response with null data
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({ 
            data: null, 
            error: null 
          })
        })
      });

      // Call the function
      const result = await fetchQuestions();

      // Verify the result
      expect(result).toEqual([]);
    });
  });

  describe('fetchTodayNewCount', () => {
    it('should fetch the count of new questions answered today', async () => {
      // Mock the Supabase response
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            gte: jest.fn().mockResolvedValue({ 
              data: [{ id: '1' }, { id: '2' }], 
              error: null 
            })
          })
        })
      });

      // Call the function
      const result = await fetchTodayNewCount('user1');

      // Verify the result
      expect(result).toBe(2);

      // Verify that the Supabase client was called correctly
      expect(supabase.from).toHaveBeenCalledWith('user_progress');
      expect(supabase.select).toHaveBeenCalledWith('id');
      expect(supabase.eq).toHaveBeenCalledWith('user_id', 'user1');
    });

    it('should throw an error if the Supabase query fails', async () => {
      // Mock the Supabase response with an error
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            gte: jest.fn().mockResolvedValue({ 
              data: null, 
              error: new Error('Database error') 
            })
          })
        })
      });

      // Call the function and expect it to throw
      await expect(fetchTodayNewCount('user1')).rejects.toThrow();
    });
    
    it('should return 0 if no userId is provided', async () => {
      // Call the function with empty userId
      const result = await fetchTodayNewCount('');

      // Verify the result
      expect(result).toBe(0);
      
      // Verify that the Supabase client wasn't called
      expect(supabase.from).not.toHaveBeenCalled();
    });
  });

  describe('fetchTotalAttemptsCount', () => {
    it('should calculate the total number of attempts correctly', async () => {
      // Mock the Supabase response
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ 
            data: [
              { attempts_count: 3 },
              { attempts_count: 2 },
              { attempts_count: null }  // Test handling null counts
            ], 
            error: null 
          })
        })
      });

      // Call the function
      const result = await fetchTotalAttemptsCount('user1');

      // Verify the result (3 + 2 + 1 for the null value)
      expect(result).toBe(6);

      // Verify that the Supabase client was called correctly
      expect(supabase.from).toHaveBeenCalledWith('user_progress');
      expect(supabase.select).toHaveBeenCalledWith('attempts_count');
      expect(supabase.eq).toHaveBeenCalledWith('user_id', 'user1');
    });

    it('should throw an error if the Supabase query fails', async () => {
      // Mock the Supabase response with an error
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ 
            data: null, 
            error: new Error('Database error') 
          })
        })
      });

      // Call the function and expect it to throw
      await expect(fetchTotalAttemptsCount('user1')).rejects.toThrow();
    });
  });
});
