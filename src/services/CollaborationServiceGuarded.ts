
import { supabase } from '@/integrations/supabase/client';
import { ExamSession, SessionParticipant, DraftQuestion } from '@/types/ExamSession';
import { toast } from 'sonner';

// Enhanced service with proper validation
export class CollaborationServiceGuarded {
  // Verify user is participant before allowing any action
  private static async verifyParticipation(sessionId: string, userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('session_participants')
        .select('id')
        .eq('session_id', sessionId)
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error verifying participation:', error);
        return false;
      }

      return !!data;
    } catch (error) {
      console.error('Error in verifyParticipation:', error);
      return false;
    }
  }

  // Verify user is host before allowing host actions
  private static async verifyHostStatus(sessionId: string, userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('session_participants')
        .select('role')
        .eq('session_id', sessionId)
        .eq('user_id', userId)
        .eq('role', 'host')
        .maybeSingle();

      if (error) {
        console.error('Error verifying host status:', error);
        return false;
      }

      return !!data;
    } catch (error) {
      console.error('Error in verifyHostStatus:', error);
      return false;
    }
  }

  static async addQuestionToSession(
    sessionId: string,
    userId: string,
    questionData: {
      question: string;
      option_a: string;
      option_b: string;
      option_c: string;
      option_d: string;
      option_e: string;
      correct_answer: 'A' | 'B' | 'C' | 'D' | 'E';
      comment?: string;
      difficulty: number;
    }
  ): Promise<DraftQuestion | null> {
    try {
      // First verify the user is a participant
      const isParticipant = await this.verifyParticipation(sessionId, userId);
      if (!isParticipant) {
        toast.error('You must join the session before adding questions');
        return null;
      }

      const { data, error } = await supabase
        .from('draft_questions')
        .insert({
          session_id: sessionId,
          creator_id: userId,
          ...questionData,
          status: 'draft'
        })
        .select()
        .single();

      if (error) throw error;

      console.log(`Question added to session ${sessionId} by ${userId}`);
      toast.success('Question added successfully');
      return data as DraftQuestion;

    } catch (error) {
      console.error('Error adding question:', error);
      toast.error('Failed to add question');
      return null;
    }
  }

  static async updateQuestionStatus(
    questionId: string,
    sessionId: string,
    userId: string,
    status: 'draft' | 'reviewed' | 'published'
  ): Promise<boolean> {
    try {
      // Verify user is host for status changes
      const isHost = await this.verifyHostStatus(sessionId, userId);
      if (!isHost) {
        toast.error('Only session hosts can review questions');
        return false;
      }

      const { error } = await supabase
        .from('draft_questions')
        .update({ status })
        .eq('id', questionId);

      if (error) throw error;

      console.log(`Question ${questionId} marked as ${status} by ${userId}`);
      toast.success(`Question marked as ${status}`);
      return true;

    } catch (error) {
      console.error('Error updating question status:', error);
      toast.error('Failed to update question status');
      return false;
    }
  }
}
