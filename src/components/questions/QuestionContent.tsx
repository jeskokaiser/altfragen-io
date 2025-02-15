
import React, { useState, useEffect } from 'react';
import { RadioGroup } from "@/components/ui/radio-group";
import AnswerOption from '../training/AnswerOption';
import { Question } from '@/types/Question';
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { toast } from "sonner";

interface QuestionContentProps {
  questionData: Question;
  selectedAnswer: string;
  onAnswerChange: (answer: string) => void;
  onConfirmAnswer: () => void;
  showFeedback: boolean;
}

const QuestionContent: React.FC<QuestionContentProps> = ({
  questionData,
  selectedAnswer,
  onAnswerChange,
  onConfirmAnswer,
  showFeedback,
}) => {
  const [resetTrigger, setResetTrigger] = useState(0);

  useEffect(() => {
    setResetTrigger(prev => prev + 1);
  }, [questionData]);

  const handleCopyToClipboard = async () => {
    const prompt = `Ich habe hier eine Multiple-Choice-Frage aus einer medizinischen Prüfung, bei der ich deine Hilfe brauche. Die Frage stammt aus dem Gedächtnisprotokoll anderer Studierender.
Bitte erkläre mir:
1. Was ist der Kerninhalt der Frage?
2. Warum ist die richtige Antwort korrekt?
3. Warum sind die anderen Antworten falsch?
4. Ist die protokollierte Lösung korrekt?

Hier ist die Frage mit allen Antwortoptionen:

Frage: ${questionData.question}

A: ${questionData.optionA}
B: ${questionData.optionB}
C: ${questionData.optionC}
D: ${questionData.optionD}
E: ${questionData.optionE}

Die richtige Antwort laut Protokoll ist: ${questionData.correctAnswer}

Zusätzlicher Kommentar(e) anderer Studierender zur Frage: ${questionData.comment || "Kein Kommentar vorhanden"}`;

    try {
      await navigator.clipboard.writeText(prompt);
      toast.success("Frage und Prompt in die Zwischenablage kopiert");
    } catch (err) {
      toast.error("Fehler beim Kopieren in die Zwischenablage");
    }
  };

  const highlightNicht = (text: string) => {
    return text.split(/(nicht|falsch|kein|keine)/i).map((part, index) =>
      ['nicht', 'falsch', 'kein', 'keine'].includes(part.toLowerCase()) ? (
        <u key={index}>{part}</u>
      ) : (
        part
      )
    );
  };

  if (!questionData) {
    return <div>Loading question...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-xl font-semibold text-slate-800 dark:text-white">
          {highlightNicht(questionData.question)}
        </h3>
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopyToClipboard}
          className="ml-2 flex items-center gap-2"
        >
          <Copy className="h-4 w-4" />
          <span className="hidden sm:inline">KI-Kopieren</span>
        </Button>
      </div>
      <RadioGroup value={selectedAnswer} onValueChange={onAnswerChange}>
        <AnswerOption value="A" text={questionData.optionA} resetTrigger={resetTrigger} />
        <AnswerOption value="B" text={questionData.optionB} resetTrigger={resetTrigger} />
        <AnswerOption value="C" text={questionData.optionC} resetTrigger={resetTrigger} />
        <AnswerOption value="D" text={questionData.optionD} resetTrigger={resetTrigger} />
        <AnswerOption value="E" text={questionData.optionE} resetTrigger={resetTrigger} />
      </RadioGroup>
    </div>
  );
};

export default QuestionContent;
