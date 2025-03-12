
import React from 'react';
import { Question } from '@/types/Question';
import EditButton from '../training/EditButton';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import ShareQuestionDialog from '../university/ShareQuestionDialog';

interface QuestionControlsProps {
  question: Question;
  onMarkUnclear: () => void;
  onEditClick?: () => void;
  onVisibilityChange?: (visibility: 'private' | 'university') => void;
}

const QuestionControls: React.FC<QuestionControlsProps> = ({ 
  question, 
  onMarkUnclear,
  onEditClick,
  onVisibilityChange
}) => {
  const { user } = useAuth();
  
  // Only show share button if the user owns the question
  const showShareButton = user && question.userId === user.id;

  return (
    <div className="flex items-center justify-end space-x-2 mt-4">
      <Button 
        variant="outline" 
        size="sm" 
        onClick={onMarkUnclear}
      >
        <AlertTriangle className="h-4 w-4 mr-2" />
        Als unklar markieren
      </Button>
      
      {onEditClick && <EditButton onClick={onEditClick} />}
      
      {showShareButton && (
        <ShareQuestionDialog 
          questionId={question.id || ''} 
          currentVisibility={question.visibility || 'private'}
          onVisibilityChange={onVisibilityChange}
        />
      )}
    </div>
  );
};

export default QuestionControls;
