import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Question } from '@/types/Question';
import EditQuestionForm from './EditQuestionForm';

interface EditQuestionModalProps {
  question: Question;
  isOpen: boolean;
  onClose: () => void;
  onQuestionUpdated: (updatedQuestion: Question) => void;
}

const EditQuestionModal: React.FC<EditQuestionModalProps> = ({
  question,
  isOpen,
  onClose,
  onQuestionUpdated,
}) => {
  if (!question) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Frage bearbeiten</DialogTitle>
        </DialogHeader>
        <EditQuestionForm
          question={question}
          onClose={onClose}
          onQuestionUpdated={onQuestionUpdated}
        />
      </DialogContent>
    </Dialog>
  );
};

export default EditQuestionModal;