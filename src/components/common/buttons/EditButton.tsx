
import React from 'react';
import { Button } from '@/components/ui/button';
import { Pencil } from 'lucide-react';

interface EditButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

const EditButton: React.FC<EditButtonProps> = ({ onClick, disabled = false }) => {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      disabled={disabled}
      className="flex items-center gap-2"
    >
      <Pencil className="h-4 w-4" />
      Bearbeiten
    </Button>
  );
};

export default EditButton;
