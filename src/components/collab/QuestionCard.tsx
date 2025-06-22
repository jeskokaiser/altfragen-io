
import React from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DraftQuestion, QuestionCardActiveUsers } from '@/types/ExamSession';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { Check, Edit2, AlertTriangle } from 'lucide-react';
import { updateDraftQuestionStatus } from '@/services/ExamSessionService';
import { toast } from 'sonner';

interface QuestionCardProps {
  question: DraftQuestion;
  onEditClick: (question: DraftQuestion) => void;
  onDeleteClick: (questionId: string) => void;
  isHost: boolean;
  activeUsers?: QuestionCardActiveUsers;
}

const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  onEditClick,
  onDeleteClick,
  isHost,
  activeUsers = {},
}) => {
  const { user } = useAuth();
  const isOwner = user?.id === question.creator_id;
  const canEdit = isOwner || isHost;
  const canReview = isHost && question.status === 'draft';
  const isReviewed = question.status === 'reviewed';
  const isPublished = question.status === 'published';

  // Check if anyone is viewing this question
  const activeViewers = Object.entries(activeUsers).filter(([userId, data]) => {
    // This is a placeholder - in a real implementation, this would check if the user is viewing this specific question
    return userId !== user?.id; // For now, just exclude the current user
  });

  // Format the time as a relative time string (e.g., "2 hours ago")
  const getRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    return format(date, 'MMM d, yyyy');
  };

  const handleReviewQuestion = async () => {
    try {
      // Update the status to 'reviewed'
      await updateDraftQuestionStatus(question.id, 'reviewed');
      toast.success('Question marked as reviewed');
    } catch (error) {
      console.error('Error reviewing question:', error);
      toast.error('Failed to review question');
    }
  };

  return (
    <Card className="h-full flex flex-col relative">
      {activeViewers.length > 0 && (
        <div className="absolute -top-2 -right-2 bg-blue-500 text-white rounded-full p-1 h-6 w-6 flex items-center justify-center text-xs">
          {activeViewers.length}
        </div>
      )}

      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <h3 className="font-medium">
            Question #{question.id.slice(-4)}
          </h3>
          <div className="flex gap-2">
            <Badge variant="outline">
              Difficulty: {question.difficulty}
            </Badge>
            <Badge 
              variant={
                isPublished 
                  ? 'secondary' 
                  : isReviewed 
                    ? 'default' 
                    : 'outline'
              }
              className={isReviewed && !isPublished ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : ''}
            >
              {question.status === 'draft' ? 'Draft' : question.status === 'reviewed' ? 'Reviewed' : 'Published'}
            </Badge>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Added {getRelativeTime(question.created_at)}
        </p>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="space-y-4">
          <p className="font-medium">{question.question}</p>
          <div className="grid grid-cols-1 gap-2 text-sm">
            <div className={`p-2 rounded-md ${question.correct_answer === 'A' ? 'bg-green-100 dark:bg-green-900/30' : ''}`}>
              A: {question.option_a}
            </div>
            <div className={`p-2 rounded-md ${question.correct_answer === 'B' ? 'bg-green-100 dark:bg-green-900/30' : ''}`}>
              B: {question.option_b}
            </div>
            <div className={`p-2 rounded-md ${question.correct_answer === 'C' ? 'bg-green-100 dark:bg-green-900/30' : ''}`}>
              C: {question.option_c}
            </div>
            <div className={`p-2 rounded-md ${question.correct_answer === 'D' ? 'bg-green-100 dark:bg-green-900/30' : ''}`}>
              D: {question.option_d}
            </div>
            <div className={`p-2 rounded-md ${question.correct_answer === 'E' ? 'bg-green-100 dark:bg-green-900/30' : ''}`}>
              E: {question.option_e}
            </div>
          </div>
          {question.comment && (
            <div className="mt-3 text-sm">
              <p className="font-medium">Comment:</p>
              <p className="text-muted-foreground">{question.comment}</p>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="pt-2 flex gap-2">
        {canEdit && (
          <>
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              onClick={() => onEditClick(question)}
            >
              <Edit2 className="h-3 w-3 mr-1" />
              Edit
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              onClick={() => onDeleteClick(question.id)}
            >
              <AlertTriangle className="h-3 w-3 mr-1" />
              Delete
            </Button>
          </>
        )}
        
        {canReview && (
          <Button
            size="sm"
            variant="outline"
            className="flex-1 bg-green-50 hover:bg-green-100 border-green-200 text-green-700 dark:bg-green-900/20 dark:hover:bg-green-900/40 dark:border-green-800 dark:text-green-400"
            onClick={handleReviewQuestion}
          >
            <Check className="h-3 w-3 mr-1" />
            Mark Reviewed
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default QuestionCard;
