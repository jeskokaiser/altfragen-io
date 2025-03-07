
import { saveQuestions, updateQuestion, markQuestionUnclear } from '@/services/DatabaseService';
import { supabase } from '@/integrations/supabase/client';
import { Question } from '@/types/Question';

// Mock the supabase client
jest.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
  }
}));

describe('DatabaseService', () => {
  // Reset all mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('saveQuestions', () => {
    it('should save questions and return the saved questions', async () => {
      // Sample question to save
      const questions: Question[] = [{
        id: '',
        question: 'Test question?',
        optionA: 'A',
        optionB: 'B',
        optionC: 'C',
        optionD: 'D',
        optionE: 'E',
        subject: 'Test',
        correctAnswer: 'A',
        comment: 'Test comment',
        filename: 'test.csv',
        difficulty: 3
      }];

      // Mock responses for insert and select
      (supabase.from as jest.Mock).mockImplementation((table) => {
        if (table === 'questions') {
          return {
            insert: jest.fn().mockResolvedValue({ error: null }),
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                order: jest.fn().mockReturnValue({
                  limit: jest.fn().mockResolvedValue({
                    data: [{
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
                      difficulty: 3
                    }],
                    error: null
                  })
                })
              })
            })
          };
        }
        return {};
      });

      // Call the function
      const result = await saveQuestions(questions, 'user1');

      // Verify the result
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1');
      expect(result[0].question).toBe('Test question?');
      expect(result[0].optionA).toBe('A');
    });

    // Add more tests...
  });
});
