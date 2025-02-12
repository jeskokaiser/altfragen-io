
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
            <p>Um mit dem Training zu beginnen, laden Sie eine CSV-Datei mit Ihren Fragen hoch. Die Datei sollte folgende Spalten enthalten:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Frage</li>
              <li>Antwortoptionen (A bis E)</li>
              <li>Korrekte Antwort</li>
              <li>Kommentar (optional)</li>
              <li>Fach</li>
              <li>Schwierigkeitsgrad (1-5)</li>
            </ul>
          </section>

          <Separator />

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">Training starten</h2>
            <p>Nach dem Hochladen können Sie:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Alle Fragen eines Datensatzes trainieren</li>
              <li>Eine bestimmte Anzahl von Fragen auswählen</li>
              <li>Nach Schwierigkeitsgrad filtern</li>
              <li>Nach Fach filtern</li>
            </ul>
          </section>

          <Separator />

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">Während des Trainings</h2>
            <p>Im Trainingsmodus haben Sie folgende Möglichkeiten:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Wählen Sie eine der Antwortoptionen aus</li>
              <li>Erhalten Sie sofortiges Feedback zur Ihrer Antwort</li>
              <li>Sehen Sie den Kommentar zur Frage (falls vorhanden)</li>
              <li>Navigieren Sie vor und zurück zwischen den Fragen</li>
              <li>Markieren Sie unklare Fragen zur späteren Überprüfung</li>
            </ul>
          </section>

          <Separator />

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">Ergebnisse und Statistiken</h2>
            <p>Nach Abschluss des Trainings:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Sehen Sie Ihre Gesamtpunktzahl</li>
              <li>Erhalten Sie eine detaillierte Aufschlüsselung Ihrer Antworten</li>
              <li>Können Sie die Statistiken pro Datensatz einsehen</li>
              <li>Haben Sie Zugriff auf unklare Fragen zur Überarbeitung</li>
            </ul>
          </section>

          <Separator />

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">Zusätzliche Funktionen</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Dark Mode: Wechseln Sie zwischen hellem und dunklem Design</li>
              <li>Responsive Design: Nutzen Sie die App auf allen Geräten</li>
              <li>Fortschrittsanzeige: Behalten Sie den Überblick über Ihren Trainingsfortschritt</li>
              <li>Automatische Speicherung: Ihr Fortschritt wird automatisch gespeichert</li>
            </ul>
          </section>
        </CardContent>
      </Card>
    </div>
  );
};

export default Tutorial;
