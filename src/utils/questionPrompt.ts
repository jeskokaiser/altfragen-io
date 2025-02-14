
import { Question } from '@/types/Question';
import { toast } from "sonner";

export const createQuestionPrompt = (questionData: Question): string => {
  return `Ich habe hier eine Multiple-Choice-Frage aus einer medizinischen Prüfung, bei der ich deine Hilfe brauche. 
Bitte erkläre mir:
1. Was ist der Kerninhalt der Frage?
2. Warum ist die richtige Antwort korrekt?
3. Warum sind die anderen Antworten falsch?
4. Welche wichtigen Konzepte sollte ich mir für diesen Themenkomplex merken?

Hier ist die Frage mit allen Antwortoptionen:

Frage: ${questionData.question}

A: ${questionData.optionA}
B: ${questionData.optionB}
C: ${questionData.optionC}
D: ${questionData.optionD}
E: ${questionData.optionE}

Die richtige Antwort ist: ${questionData.correctAnswer}

Zusätzlicher Kommentar zur Frage: ${questionData.comment || "Kein Kommentar vorhanden"}`;
};

export const copyToClipboard = async (text: string): Promise<void> => {
  try {
    await navigator.clipboard.writeText(text);
    toast.success("Frage und Prompt in die Zwischenablage kopiert");
  } catch (err) {
    toast.error("Fehler beim Kopieren in die Zwischenablage");
  }
};
