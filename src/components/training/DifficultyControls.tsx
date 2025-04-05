
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
  onEditClick?: () => void;
}

const DifficultyControls: React.FC<DifficultyControlsProps> = ({
  questionId,
  difficulty,
  onEditClick,
}) => {
  const [currentDifficulty, setCurrentDifficulty] = useState(difficulty);
  const [attemptsCount, setAttemptsCount] = useState(0);
  const [isUserSpecificDifficulty, setIsUserSpecificDifficulty] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const fetchUserProgress = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from('user_progress')
        .select('attempts_count, user_difficulty')
        .eq('question_id', questionId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching user progress:', error);
        return;
      }

      if (data) {
        setAttemptsCount(data.attempts_count || 0);
        
        // If user has a specific difficulty, use that instead of the question's default
        if (data.user_difficulty !== null) {
          setCurrentDifficulty(data.user_difficulty);
          setIsUserSpecificDifficulty(true);
        } else {
          setCurrentDifficulty(difficulty);
          setIsUserSpecificDifficulty(false);
        }
      } else {
        setCurrentDifficulty(difficulty);
        setIsUserSpecificDifficulty(false);
      }
    };

    fetchUserProgress();
  }, [questionId, difficulty, user]);

  const handleDifficultyChange = async (value: string) => {
    const newDifficulty = parseInt(value);
    if (isNaN(newDifficulty) || newDifficulty < 1 || newDifficulty > 5) return;

    if (!user) {
      toast.error("Du musst angemeldet sein, um die Schwierigkeit zu ändern");
      return;
    }

    try {
      // Check if user progress entry already exists
      const { data: existingProgress } = await supabase
        .from('user_progress')
        .select('id')
        .eq('question_id', questionId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingProgress) {
        // Update existing progress entry
        const { error } = await supabase
          .from('user_progress')
          .update({ user_difficulty: newDifficulty })
          .eq('id', existingProgress.id);

        if (error) throw error;
      } else {
        // Create new progress entry
        const { error } = await supabase
          .from('user_progress')
          .insert({
            user_id: user.id,
            question_id: questionId,
            user_difficulty: newDifficulty,
            attempts_count: 0
          });

        if (error) throw error;
      }

      setCurrentDifficulty(newDifficulty);
      setIsUserSpecificDifficulty(true);
      toast.info("Persönlicher Schwierigkeitsgrad aktualisiert");
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
          isPersonalized={isUserSpecificDifficulty}
        />
        {onEditClick && <EditButton onClick={onEditClick} />}
      </div>
      
      <DifficultyToggle 
        value={currentDifficulty.toString()}
        onValueChange={handleDifficultyChange}
      />
    </div>
  );
};

export default DifficultyControls;
