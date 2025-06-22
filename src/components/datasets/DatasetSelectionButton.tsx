
import React from 'react';
import { Button } from "@/components/ui/button";
import { Settings, ListPlus, Check } from 'lucide-react';

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
  const isAllSelected = selectedCount === totalCount;
  const hasSelection = selectedCount > 0;
  
  return (
    <Button 
      variant={hasSelection ? "default" : "outline"} 
      size="sm" 
      onClick={onClick}
      className="flex items-center gap-2"
    >
      {hasSelection ? (
        <Settings className="h-4 w-4" />
      ) : (
        <ListPlus className="h-4 w-4" />
      )}
      <span>
        {selectedCount === 0 
          ? `Datensätze wählen (${totalCount})` 
          : isAllSelected
          ? `Alle ${totalCount} ausgewählt`
          : `${selectedCount}/${totalCount} ausgewählt`}
      </span>
      {hasSelection && !isAllSelected && (
        <Check className="h-3 w-3" />
      )}
    </Button>
  );
};

export default DatasetSelectionButton;
