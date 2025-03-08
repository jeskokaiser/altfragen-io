
import React from 'react';
import { Question } from '@/types/models/Question';
import EditQuestionModal from '@/components/features/training/EditQuestionModal';

interface EditQuestionModalWrapperProps {
  question: Question;
  isOpen: boolean;
  onClose: () => void;
  onQuestionUpdated: (updatedQuestion: Question) => void;
}

const EditQuestionModalWrapper: React.FC<EditQuestionModalWrapperProps> = ({
  question,
  isOpen,
  onClose,
  onQuestionUpdated
}) => {
  return (
    <EditQuestionModal
      question={question}
      isOpen={isOpen}
      onClose={onClose}
      onQuestionUpdated={onQuestionUpdated}
    />
  );
};

export default EditQuestionModalWrapper;
