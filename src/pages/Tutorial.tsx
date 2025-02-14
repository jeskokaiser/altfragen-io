
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

const Tutorial = () => {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto px-4 py-6 space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => navigate('/dashboard')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Zurück zum Dashboard
        </Button>
        <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Tutorial</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Willkommen beim Tutorial</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <section className="space-y-3">
            <h2 className="text-xl font-semibold">Datensätze hochladen</h2>
            <p>Um mit dem Training zu beginnen, lade eine CSV-Datei mit den Fragen hoch. Die Datei sollte folgende Spalten enthalten:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Frage</li>
              <li>Antwortoptionen (A bis E)</li>
              <li>Korrekte Antwort</li>
              <li>Kommentar</li>
              <li>Fach</li>
              <li>Schwierigkeitsgrad (1-5)</li>
            </ul>
            <p>Der Name der Datei sollte auf die Klausur schließen lassen (z.B. A1_2021-2024), damit du sie im Dashboard richtig erkennen kannst.</p>
          </section>

          <Separator />

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">Training starten</h2>
            <p>Nach dem Hochladen kannst du</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Alle Fragen eines Datensatzes trainieren</li>
              <li>Eine bestimmte Anzahl von Fragen auswählen</li>
              <li>Nach Schwierigkeitsgrad filtern</li>
              <li>Nach Fach filtern</li>
            </ul>
            <p>Bitte bachte, dass alle Fragen standardmäßig den Schwierigkeitsgrad 3 haben, sofern er nicht in der csv-Datei festgelegt wurde oder beim trainieren geändert wurde.</p>
            <p>Nach Ende der ausgewählten Anzahl der Fragen werden dir einmal alle beantworteten Fragen in der Übersicht angezeigt</p>
          </section>

          <Separator />

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">Während des Trainings</h2>
            <p>Im Trainingsmodus hast du folgende Möglichkeiten:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Wähle eine der Antwortoptionen aus</li>
              <li>Erhalte sofortiges Feedback zur Antwort</li>
              <li>Der Kommentar zur Frage (falls vorhanden) wird nach der Antwort</li>
              <li>Markiere unklare Fragen zur späteren Überprüfung im Dashboard</li>
              <li>Kopiere die Frage mitsamt Antwort und Kommentar zusammen mit einem Prompt, um sie in einer Chatbot-KI / LLM deiner Wahl erklären zu lassen</li>
            </ul>
            <p>Falls eine Frage falsch dokumentiert oder die falsche Antwortmöglichkeit ausgefählt wurde, nutze den Bearbeiten Button. Im Bearbeitungsmenü kannst du den Pfeil neben der Antwortzeile nutzen, um die falsche Antwort automatisch in die Kommentarspalte zu verschieben</p>
            <p>Eine Antwort kann nur als richtig erkannt werden, wenn das erste Zeichen in der Antwortzeile der richtige Buchstabe ist</p>
          </section>

    

          <Separator />

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">Zusätzliche Funktionen</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Dark Mode: Wechse zwischen hellem und dunklem Design (Beta)</li>
              <li>Responsives Design: Die Web-App kann auf allen Geräten (Computer, Tablet, Handy) genutzt werden</li>
              <li>Fortschrittsanzeige: Behalte den Überblick über deinen Trainingsfortschritt</li>
              <li>Automatische Speicherung: Der Fortschritt wird immer automatisch gespeichert, solange eine Internetverbindung besteht</li>
            </ul>
          </section>
        </CardContent>
      </Card>
    </div>
  );
};

export default Tutorial;
