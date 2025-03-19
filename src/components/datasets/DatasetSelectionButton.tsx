
import React from 'react';
import { Button } from "@/components/ui/button";
import { ListPlus } from 'lucide-react';

interface DatasetSelectionButtonProps {
  onClick: () => void;
  totalCount: number;
  selectedCount: number;
}

const DatasetSelectionButton: React.FC<DatasetSelectionButtonProps> = ({
  onClick,
  totalCount,
  selectedCount
}) => {
  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={onClick}
      className="flex items-center gap-2"
    >
      <ListPlus className="h-4 w-4" />
      <span>
        {selectedCount === 0 
          ? `Datensätze auswählen (${totalCount})` 
          : `${selectedCount} ausgewählt`}
      </span>
    </Button>
  );
};

export default DatasetSelectionButton;
