
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  BookOpen,
  Upload,
  Edit,
  GraduationCap,
  Lock,
  Lightbulb,
  FileText,
  Files,
  FileUp,
  CheckCircle,
  BarChart,
  Sparkles,
  Search,
  ArrowRight,
  Calendar,
  ListPlus,
  Play,
  TrendingUp,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const TutorialStep: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode }> = ({ icon, title, children }) => (
  <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/50">
    <div className="flex-shrink-0 w-10 h-10 bg-primary/10 text-primary rounded-full flex items-center justify-center">
      {icon}
    </div>
    <div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <div className="text-muted-foreground mt-1 text-sm">{children}</div>
    </div>
  </div>
);

const Tutorial = () => {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto px-4 py-8 space-y-8 max-w-5xl">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <BookOpen className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">Willkommen bei Altfragen.io!</h1>
        </div>
        <Button variant="outline" size="sm" onClick={() => navigate('/dashboard')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Zurück zum Dashboard
        </Button>
      </header>

      <p className="text-lg text-muted-foreground text-center mb-8">
        Dieses Tutorial führt dich durch die wichtigsten Funktionen, damit du sofort loslegen kannst.
      </p>


      

      {/* Bevorstehende Prüfungen Section */}
      <section className="space-y-4">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-shrink-0 w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center">
            <Calendar className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Bevorstehende Prüfungen</h2>
        </div>
        <Card>
          <CardHeader>
            <CardDescription>
              Plane deine Prüfungen, verknüpfe relevante Fragen und behalte deinen Lernfortschritt im Blick.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <TutorialStep icon={<Calendar className="w-5 h-5" />} title="1. Neue Prüfung anlegen">
              <p>Klicke im Dashboard auf "Neue Prüfung" und gib die wichtigsten Informationen ein:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li><strong className="font-semibold">Titel:</strong> Name der Prüfung (z.B. "Anatomie Testat 1")</li>
                <li><strong className="font-semibold">Datum:</strong> Wann findet die Prüfung statt?</li>
                <li><strong className="font-semibold">Fach:</strong> Optional - für bessere Organisation</li>
              </ul>
              <p className="mt-2">Die Prüfung wird dann mit einem Countdown im Dashboard angezeigt.</p>
            </TutorialStep>
            
            <TutorialStep icon={<ListPlus className="w-5 h-5" />} title="2. Fragen verknüpfen">
              <p>Nachdem du eine Prüfung angelegt hast, kannst du relevante Fragen aus deinen Datensätzen verknüpfen:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Klicke auf das <strong className="font-semibold">Zahnrad-Symbol</strong> bei der Prüfung</li>
                <li>Wähle "Fragen verwalten" aus</li>
                <li>Wähle Datensätze aus deinen <strong className="font-semibold">eigenen</strong> oder <strong className="font-semibold">Uni-Datensätzen</strong></li>
                <li>Bestätige mit "Verknüpfen" - die Fragen werden der Prüfung zugeordnet</li>
              </ul>
              <p className="mt-2">Du kannst jederzeit weitere Fragen hinzufügen oder entfernen.</p>
            </TutorialStep>

            <TutorialStep icon={<Play className="w-5 h-5" />} title="3. Gezielt für die Prüfung trainieren">
              <p>Mit verknüpften Fragen kannst du direkt für diese Prüfung trainieren:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li><strong className="font-semibold">Neue Session erstellen:</strong> Starte eine neue Trainingssession mit allen verknüpften Fragen</li>
                <li><strong className="font-semibold">Sessions verfolgen:</strong> Siehe alle laufenden Sessions zu dieser Prüfung auf einen Blick</li>
                <li><strong className="font-semibold">Sessions fortsetzen:</strong> Mache dort weiter, wo du aufgehört hast</li>
              </ul>
            </TutorialStep>

            <TutorialStep icon={<TrendingUp className="w-5 h-5" />} title="4. Fortschritt verfolgen">
              <p>Behalte deinen Lernfortschritt im Auge:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li><strong className="font-semibold">Beantwortet:</strong> Wie viele Fragen hast du bereits bearbeitet?</li>
                <li><strong className="font-semibold">Richtig:</strong> Wie viele Fragen wurden korrekt beantwortet?</li>
                <li><strong className="font-semibold">Quote:</strong> Deine Erfolgsrate in Prozent</li>
                <li><strong className="font-semibold">Auswertung:</strong> Detaillierte Analyse deiner Leistung pro Fach und Schwierigkeit</li>
              </ul>
              <p className="mt-2">So kannst du gezielt Schwachstellen identifizieren und bearbeiten!</p>
            </TutorialStep>
          </CardContent>
        </Card>
      </section>
      {/* Training & Üben Section */}
      <section className="space-y-4">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-shrink-0 w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center">
            <Sparkles className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Training & Üben</h2>
        </div>
        <Card>
          <CardHeader>
            <CardDescription>
              Nutze tausende Fragen von dir und deiner Universität, um dich optimal vorzubereiten.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            
            <TutorialStep icon={<CheckCircle className="w-5 h-5" />} title="1. Fragen beantworten & Feedback erhalten">
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li><strong className="font-semibold">Flexibles Training:</strong> Wähle in den Einstellungen, ob du sofort Feedback erhalten möchtest oder mehrere Versuche pro Frage nutzen willst</li>
                <li><strong className="font-semibold">Sofortiges Feedback:</strong> Nach der Antwort siehst du die richtige Lösung und hilfreiche Kommentare</li>
                <li><strong className="font-semibold">KI-Kommentare:</strong> Erhalte detaillierte KI-Erklärungen zu jeder Antwortoption. Das kostenlose Konto bietet tägliche KI-Kommentare, Premium-Nutzer erhalten unbegrenzte Zugriffe</li>
                <li><strong className="font-semibold">Automatische Speicherung:</strong> Dein Fortschritt wird automatisch gespeichert, du kannst jederzeit pausieren und später weitermachen</li>
              </ul>
            </TutorialStep>

            <TutorialStep icon={<Edit className="w-5 h-5" />} title="2. Fragen verbessern & personalisieren">
              <p>Trage aktiv zur Qualität bei und passe Fragen an deine Bedürfnisse an:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li><strong className="font-semibold">Fragen bearbeiten:</strong> Korrigiere Tippfehler oder passe Antworten an. Bei geteilten Fragen profitieren alle von deinen Korrekturen!</li>
                <li><strong className="font-semibold">Fragen ignorieren:</strong> Blende störende oder unpassende Fragen aus - sie werden in zukünftigen Sessions übersprungen</li>
                <li><strong className="font-semibold">Bildzeitpunkt anpassen:</strong> Bestimme, wann Bilder angezeigt werden (vor oder nach der Antwort), um Spoiler zu vermeiden oder visuelle Hinweise zu nutzen</li>
                <li><strong className="font-semibold">Schwierigkeit festlegen:</strong> Markiere Fragen mit verschiedenen Schwierigkeitsstufen für gezieltes Üben</li>
              </ul>
            </TutorialStep>

            <TutorialStep icon={<BarChart className="w-5 h-5" />} title="3. Fortschritt analysieren">
              <p>Verfolge deinen Lernfortschritt mit detaillierten Statistiken:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li><strong className="font-semibold">Dashboard-Übersicht:</strong> Sieh auf einen Blick, wie viele Fragen du heute geübt hast</li>
                <li><strong className="font-semibold">Session-Statistiken:</strong> Detaillierte Auswertung jeder Trainingssession mit Erfolgsquote und Zeitaufwand</li>
                <li><strong className="font-semibold">Prüfungs-Analytics:</strong> Analysiere deine Leistung nach Fach, Schwierigkeit und Zeitraum</li>
              </ul>
            </TutorialStep>
          </CardContent>
        </Card>
      </section>

      {/* Fragen hochladen Section */}
      <section className="space-y-4">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-shrink-0 w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center">
            <Upload className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Fragen hochladen</h2>
        </div>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Eigene Fragen hochladen</CardTitle>
              <CardDescription>
                Erweitere die Fragendatenbank mit deinen eigenen Lernmaterialien.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Wichtige Tipps vor dem Upload</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3 p-3 rounded-md bg-muted/50">
                    <Lightbulb className="h-5 w-5 mt-1 text-primary" />
                    <div>
                      <h5 className="font-medium">Sinnvolle Dateinamen</h5>
                      <p className="text-sm text-muted-foreground">Benenne deine Dateien klar, z.B. <code className="bg-muted px-1 rounded-sm">Anatomie_Testat1_WS23.pdf</code>. Das hilft dir, sie später wiederzufinden.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-md bg-muted/50">
                    <Lock className="h-5 w-5 mt-1 text-primary" />
                    <div>
                      <h5 className="font-medium">Sichtbarkeit wählen</h5>
                      <p className="text-sm text-muted-foreground">Entscheide, ob deine Fragen <strong className="font-semibold">privat</strong> bleiben oder mit deiner <strong className="font-semibold">Universität</strong> (<GraduationCap className="inline h-4 w-4" />) geteilt werden sollen. Geteilte Fragen können nicht mehr privat gemacht werden!</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger className="text-base font-medium flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" /> CSV-Upload
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground p-4">
                Der Klassiker für strukturierte Daten. Deine CSV-Datei sollte die Spalten <code className="bg-muted px-1 rounded-sm">Frage, A, B, C, D, E, Fach, Antwort, Kommentar</code> enthalten. Die Spalte `Schwierigkeitsgrad` ist optional.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger className="text-base font-medium flex items-center gap-2">
                <FileUp className="h-5 w-5 text-primary" /> Einzelner PDF-Upload
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground p-4">
                Lade eine einzelne Klausur als PDF hoch. Unsere KI extrahiert die Fragen automatisch. Du hast danach die Möglichkeit, die erkannten Fragen zu überprüfen und zu bearbeiten, bevor du sie speicherst.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3">
              <AccordionTrigger className="text-base font-medium flex items-center gap-2">
                <Files className="h-5 w-5 text-primary" /> Batch-PDF-Upload (Massen-Upload)
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground p-4">
                Die schnellste Methode für viele Dateien. Lade mehrere PDFs auf einmal hoch und weise ihnen direkt Prüfungsname, Semester und Jahr zu. Perfekt, um einen ganzen Ordner alter Klausuren zu verarbeiten.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* Large Continue Button */}
      <div className="flex justify-center pt-8 pb-4">
        <Button 
          size="lg" 
          onClick={() => navigate('/dashboard')}
          className="text-lg px-8 py-6 h-auto flex items-center gap-3 shadow-lg hover:shadow-xl transition-all"
        >
          Zum Dashboard fortfahren
          <ArrowRight className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};

export default Tutorial;
