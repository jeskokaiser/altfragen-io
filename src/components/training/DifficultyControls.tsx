import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import DifficultyBadge from './DifficultyBadge';
import DifficultyToggle from './DifficultyToggle';
import { useAuth } from '@/contexts/AuthContext';
import { fetchUserQuestionProgress, setUserDifficulty } from '@/services/UserProgressService';

interface DifficultyControlsProps {
  questionId: string;
  difficulty: number;
  disabled?: boolean;
  semester?: string;
  year?: string;
  subject?: string;
}

const DifficultyControls: React.FC<DifficultyControlsProps> = ({
  questionId,
  difficulty,
  disabled = false,
  semester,
  year,
  subject,
}) => {
  const [currentDifficulty, setCurrentDifficulty] = useState(difficulty);
  const [attemptsCount, setAttemptsCount] = useState(0);
  const { user } = useAuth();

  useEffect(() => {
    if (disabled) {
      setCurrentDifficulty(difficulty);
      setAttemptsCount(0);
      return;
    }

    const loadUserProgress = async () => {
      if (!user) return;

      try {
        const progress = await fetchUserQuestionProgress(user.id, questionId);

        // The user's own difficulty overrides the question's default.
        setAttemptsCount(progress?.attemptsCount ?? 0);
        setCurrentDifficulty(progress?.userDifficulty ?? difficulty);
      } catch (error) {
        console.error('Error fetching user progress:', error);
      }
    };

    loadUserProgress();
  }, [questionId, difficulty, user, disabled]);

  const handleDifficultyChange = async (value: string) => {
    if (disabled) return;

    const newDifficulty = parseInt(value);
    if (isNaN(newDifficulty) || newDifficulty < 1 || newDifficulty > 5) return;

    if (!user) {
      toast.error('Du musst angemeldet sein, um die Schwierigkeit zu ändern');
      return;
    }

    try {
      await setUserDifficulty(user.id, questionId, newDifficulty);

      setCurrentDifficulty(newDifficulty);
      toast.info('Persönlicher Schwierigkeitsgrad aktualisiert');
    } catch (error) {
      console.error('Error updating difficulty:', error);
      toast.error('Fehler beim Aktualisieren des Schwierigkeitsgrads');
    }
  };

  return (
    <div className="flex flex-col gap-4 mb-4">
      <div className="flex justify-between items-center">
        <DifficultyBadge
          attemptsCount={attemptsCount}
          semester={semester}
          year={year}
          subject={subject}
        />
      </div>

      <DifficultyToggle
        value={currentDifficulty.toString()}
        onValueChange={handleDifficultyChange}
        disabled={disabled}
      />
    </div>
  );
};

export default DifficultyControls;
