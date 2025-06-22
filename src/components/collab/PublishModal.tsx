import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DraftQuestion } from '@/types/ExamSession';
import { publishDraftQuestions } from '@/services/ExamSessionService';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface PublishModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
  questions: DraftQuestion[];
  sessionTitle: string;
}

const PublishModal: React.FC<PublishModalProps> = ({
  isOpen,
  onClose,
  sessionId,
  questions,
  sessionTitle,
}) => {
  const { user, universityId } = useAuth();
  const [filename, setFilename] = useState(() => {
    // Generate a default filename based on session title
    const sanitized = sessionTitle.toLowerCase().replace(/[^a-z0-9]/g, '_');
    return `${sanitized}_${new Date().toISOString().split('T')[0]}`;
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePublish = async () => {
    if (!user) {
      toast.error('You must be logged in to publish questions');
      return;
    }

    if (!filename.trim()) {
      toast.error('Please enter a valid filename');
      return;
    }

    try {
      setIsSubmitting(true);
      // The publishDraftQuestions function expects sessionId, universityId, userId in that order
      await publishDraftQuestions(sessionId, universityId, user.id);
      
      // Log activity in session_activities table
      await supabase.from('session_activities' as any).insert({
        session_id: sessionId,
        user_id: user.id,
        activity_type: 'publish',
        message: `published ${questions.length} questions to their question bank`,
        entity_id: null
      });
      
      // Also broadcast event for real-time notification
      const channel = supabase.channel(`room_${sessionId}`);
      await channel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Broadcast publication event
          await channel.send({
            type: 'broadcast',
            event: 'questions_published',
            payload: {
              user_id: user.id,
              count: questions.length,
              timestamp: new Date().toISOString()
            }
          });
        }
      });
      
      toast.success(`${questions.length} questions published successfully`);
      onClose();
    } catch (error) {
      console.error('Error publishing questions:', error);
      toast.error('Failed to publish questions');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Publish Questions</DialogTitle>
          <DialogDescription>
            You are about to publish {questions.length} questions to your personal question bank.
            Once published, these questions will be available for training.
          </DialogDescription>
        </DialogHeader>

        <div className="my-4">
          <label htmlFor="filename" className="block text-sm font-medium mb-1">
            Dataset Filename
          </label>
          <Input
            id="filename"
            value={filename}
            onChange={(e) => setFilename(e.target.value)}
            placeholder="Enter a filename for this dataset"
          />
          <p className="text-xs text-muted-foreground mt-1">
            This will help you identify this set of questions in your dashboard.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handlePublish} disabled={isSubmitting || !filename.trim()}>
            {isSubmitting ? 'Publishing...' : 'Publish Questions'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PublishModal;
