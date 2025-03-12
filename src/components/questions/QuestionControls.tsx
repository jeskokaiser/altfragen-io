
import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, Copy } from 'lucide-react';
import DifficultyControls from '../training/DifficultyControls';
import { showToast } from '@/utils/toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { Question } from '@/types/Question';

interface QuestionControlsProps {
  question: Question;
  onEditClick: () => void;
  onMarkUnclear: () => void;
}

const QuestionControls: React.FC<QuestionControlsProps> = ({
  question,
  onEditClick,
  onMarkUnclear,
}) => {
  const isMobile = useIsMobile();

  const handleCopyToClipboard = async () => {
    const prompt = `Du unterstützt mich als Experte mit 20+ Jahren Erfahrung in medizinischen Prüfungen als Tutor bei der Lösung einer Multiple-Choice-Frage aus einer medizinischen Prüfung, die aus den Gedächtnisprotokollen anderer Studierender stammt. Analysiere die Frage und beantworte folgende Punkte:

1. Was ist der Kerninhalt der Frage? Gib eine kurze, auf den Punkt gebrachte thematische Übersicht.
2. Ist die protokollierte Lösung korrekt? Analysiere kritisch und wähle im Zweifel eine andere Antwort, wenn diese deutlich besser passt.
3. Warum ist die richtige Antwort korrekt?
4. Warum sind die anderen Antworten falsch?


Hier ist die Frage mit allen Antwortoptionen. Nur eine dieser Optionen kann richtig sein:

Frage: ${question.question}

A: ${question.optionA}
B: ${question.optionB}
C: ${question.optionC}
D: ${question.optionD}
E: ${question.optionE}

Die richtige Antwort laut Protokoll ist: ${question.correctAnswer}

Zusätzlicher Kommentar(e) anderer Studierender zur Frage: ${question.comment || "Kein Kommentar vorhanden"}`;

    try {
      await navigator.clipboard.writeText(prompt);
      showToast.info("Frage und Prompt in die Zwischenablage kopiert");
    } catch (err) {
      showToast.error("Fehler beim Kopieren in die Zwischenablage");
    }
  };

  return (
    <div className={`flex flex-col sm:flex-row sm:items-stretch gap-3 mb-4`}>
      <div className="flex-grow">
        <DifficultyControls
          questionId={question.id}
          difficulty={question.difficulty || 3}
          onEditClick={onEditClick}
        />
      </div>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopyToClipboard}
          className="flex items-center gap-2"
        >
          <Copy className="h-4 w-4" />
          <span className="hidden sm:inline">KI-Kopieren</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onMarkUnclear}
          className="flex items-center gap-2"
          disabled={question.is_unclear}
        >
          <AlertCircle className="h-4 w-4" />
          <span className="hidden sm:inline">Unklar</span>
          <span className="sm:hidden">?!</span>
        </Button>
      </div>
    </div>
  );
};

export default QuestionControls;
