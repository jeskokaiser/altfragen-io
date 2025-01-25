import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from "sonner";
import DifficultyBadge from './DifficultyBadge';
import DifficultyToggle from './DifficultyToggle';
import EditButton from './EditButton';

interface DifficultyControlsProps {
  questionId: string;
  difficulty: number;
  onEditClick: () => void;
}

const DifficultyControls: React.FC<DifficultyControlsProps> = ({
  questionId,
  difficulty,
  onEditClick,
}) => {
  const [currentDifficulty, setCurrentDifficulty] = useState(difficulty);

  const handleDifficultyChange = async (value: string) => {
    const newDifficulty = parseInt(value);
    if (isNaN(newDifficulty) || newDifficulty < 1 || newDifficulty > 5) return;

    try {
      const { error } = await supabase
        .from('questions')
        .update({ difficulty: newDifficulty })
        .eq('id', questionId);

      if (error) {
        console.error('Error updating difficulty:', error);
        toast.error("Fehler beim Aktualisieren des Schwierigkeitsgrads");
        return;
      }

      setCurrentDifficulty(newDifficulty);
      toast.success("Schwierigkeitsgrad aktualisiert");
      
      // Reload the page after a short delay to show the toast
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error('Error updating difficulty:', error);
      toast.error("Fehler beim Aktualisieren des Schwierigkeitsgrads");
    }
  };

  return (
    <div className="flex flex-col gap-4 mb-4">
      <div className="flex justify-between items-center">
        <DifficultyBadge difficulty={currentDifficulty} />
        <EditButton onClick={onEditClick} />
      </div>
      
      <DifficultyToggle 
        value={currentDifficulty.toString()}
        onValueChange={handleDifficultyChange}
      />
    </div>
  );
};

export default DifficultyControls;