
import { fetchQuestions, fetchTodayNewCount, fetchTodayPracticeCount, 
         fetchTotalAnsweredCount, fetchTotalAttemptsCount } from '@/services/QuestionService';
import { supabase } from '@/integrations/supabase/client';

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
      await expect(fetchQuestions()).rejects.toThrow('Database error');
    });
  });

  // Add more tests for other functions...
});
