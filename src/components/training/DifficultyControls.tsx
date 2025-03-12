
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from "sonner";
import DifficultyBadge from './DifficultyBadge';
import DifficultyToggle from './DifficultyToggle';
import EditButton from './EditButton';
import { useAuth } from '@/contexts/AuthContext';

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
  const [attemptsCount, setAttemptsCount] = useState(0);
  const { user } = useAuth();

  useEffect(() => {
    setCurrentDifficulty(difficulty);
  }, [difficulty, questionId]);

  useEffect(() => {
    const fetchAttemptsCount = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from('user_progress')
        .select('attempts_count')
        .eq('question_id', questionId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching attempts count:', error);
        return;
      }

      setAttemptsCount(data?.attempts_count || 0);
    };

    fetchAttemptsCount();
  }, [questionId, user]);

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
      toast.info("Schwierigkeitsgrad aktualisiert");
    } catch (error) {
      console.error('Error updating difficulty:', error);
      toast.error("Fehler beim Aktualisieren des Schwierigkeitsgrads");
    }
  };

  return (
    <div className="flex flex-col gap-4 mb-4">
      <div className="flex justify-between items-center">
        <DifficultyBadge 
          difficulty={currentDifficulty} 
          attemptsCount={attemptsCount}
        />
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
