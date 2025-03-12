
import React from 'react';
import { Button } from '@/components/ui/button';
import { Pencil } from 'lucide-react';

interface EditButtonProps {
  onClick?: () => void;
}

const EditButton: React.FC<EditButtonProps> = ({ onClick }) => {
  return (
    <Button 
      variant="outline" 
      size="sm"
      onClick={onClick}
    >
      <Pencil className="h-4 w-4 mr-2" />
      Bearbeiten
    </Button>
  );
};

export default EditButton;
