
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from "sonner";
import DifficultyBadge from './DifficultyBadge';
import DifficultyToggle from './DifficultyToggle';
import EditButton from './EditButton';
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";

interface DifficultyControlsProps {
  questionId: string;
  difficulty: number;
  onEditClick: () => void;
  questionData: any; // Adding this prop to access question data
}

const DifficultyControls: React.FC<DifficultyControlsProps> = ({
  questionId,
  difficulty,
  onEditClick,
  questionData,
}) => {
  const [currentDifficulty, setCurrentDifficulty] = useState(difficulty);

  useEffect(() => {
    setCurrentDifficulty(difficulty);
  }, [difficulty, questionId]);

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
    } catch (error) {
      console.error('Error updating difficulty:', error);
      toast.error("Fehler beim Aktualisieren des Schwierigkeitsgrads");
    }
  };

  const handleCopyToClipboard = async () => {
    const prompt = `Ich habe hier eine Multiple-Choice-Frage aus einer medizinischen Prüfung, bei der ich deine Hilfe brauche. Die Frage stammt aus dem Gedächnisprotokoll anderer Studenten.
Bitte erkläre mir:
1. Was ist der Kerninhalt der Frage?
2. Warum ist die richtige Antwort korrekt?
3. Warum sind die anderen Antworten falsch?
4. Ist die protokollierte lösung korrekt?

Hier ist die Frage mit allen Antwortoptionen:

Frage: ${questionData.question}

A: ${questionData.optionA}
B: ${questionData.optionB}
C: ${questionData.optionC}
D: ${questionData.optionD}
E: ${questionData.optionE}

Die richtige Antwort laut den Studenten ist: ${questionData.correctAnswer}

Zusätzlicher Kommentar anderer Studenten zur Frage: ${questionData.comment || "Kein Kommentar vorhanden"}`;

    try {
      await navigator.clipboard.writeText(prompt);
      toast.success("Frage und Prompt in die Zwischenablage kopiert");
    } catch (err) {
      toast.error("Fehler beim Kopieren in die Zwischenablage");
    }
  };

  return (
    <div className="flex flex-col gap-4 mb-4">
      <div className="flex justify-between items-center">
        <DifficultyBadge difficulty={currentDifficulty} />
        <div className="flex gap-2">
          <EditButton onClick={onEditClick} />
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyToClipboard}
            className="flex items-center gap-2"
          >
            <Copy className="h-4 w-4" />
            <span className="hidden sm:inline">KI-Kopieren</span>
          </Button>
        </div>
      </div>
      
      <DifficultyToggle 
        value={currentDifficulty.toString()}
        onValueChange={handleDifficultyChange}
      />
    </div>
  );
};

export default DifficultyControls;
