
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  BookOpen,
  Upload,
  Edit,
  BrainCircuit,
  GraduationCap,
  Lock,
  Lightbulb,
  FileText,
  Files,
  FileUp,
  CheckCircle,
  BarChart,
  University,
  Sparkles,
  Search,
  ArrowRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

      <p className="text-lg text-muted-foreground text-center">
        Dieses Tutorial führt dich durch die wichtigsten Funktionen, damit du sofort loslegen kannst.
      </p>

      <Tabs defaultValue="training" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="training" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Training & Üben
          </TabsTrigger>
          <TabsTrigger value="uploading" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Fragen hochladen
          </TabsTrigger>
        </TabsList>

        <TabsContent value="training" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Training mit vorhandenen Fragen</CardTitle>
              <CardDescription>
                Nutze tausende Fragen von dir und deiner Universität, um dich optimal vorzubereiten.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <TutorialStep icon={<Search className="w-5 h-5" />} title="1. Fragen finden & Training starten">
                <p>Im Dashboard siehst du deine privaten Datensätze und die, die von deiner Universität geteilt wurden. Wähle einen oder mehrere aus, filtere bei Bedarf nach Fach oder Schwierigkeit und starte deine Lernsitzung.</p>
              </TutorialStep>
              
              <TutorialStep icon={<CheckCircle className="w-5 h-5" />} title="2. Fragen beantworten & Feedback erhalten">
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li><strong className="font-semibold">Trainingsmodus:</strong> Im Trainingsmodus kannst du Fragen beantworten wählen, ob du sofort Feedback erhalten möchtest oder mehrere Versuche pro Frage nutzen möchtest. Lege dies in den Einstellungen fest.</li>
                  <li><strong className="font-semibold">Feedback erhalten:</strong> Nachdem du geantwortet hast, werden die richtige Lösung und hilfreiche Kommentare angezeigt. Dein Fortschritt wird automatisch gespeichert.</li>
                  <li><strong className="font-semibold">KI-Kommentare nutzen:</strong> Mit dem dauerhaft kostenlosen Konto erhältst du eine tägliche Anzahl an KI-Kommentaren mit detaillierten KI-Erklärungen zu jeder Antwortoption, um den Stoff noch besser zu verstehen. Premium-Nutzer erhalten unbegrenzt KI-Kommentare.</li>
                </ul>
              </TutorialStep>

              <TutorialStep icon={<BarChart className="w-5 h-5" />} title="3. Qualität der Fragen verbessern">
                <p>Gute Fragen sind das A und O. Du kannst aktiv zur Qualität beitragen:</p>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li><strong className="font-semibold">Fragen bearbeiten:</strong> Korrigiere Tippfehler oder passe Antwortmöglichkeiten an. Wenn du denkst, dass eine Antwort falsch ist, bearbeite die Frage - sie wird dann bei geteilten Fragen für alle Nutzer korrigiert!</li>
                  <li><strong className="font-semibold">Fragen ignorieren:</strong> Störende oder unpassende Fragen kannst du ignorieren. Sie werden dann in zukünftigen Trainings übersprungen.</li>
                  <li><strong className="font-semibold">Anzeigezeitpunkt des Bildes festlegen:</strong> Du kannst pro Frage festlegen, wann das Bild angezeigt wird. Bilder werden standardmäßig nach der Antwort angezeigt, damit die Frage nicht gespoilert wird. Bei Fragen, zu denen das Bild wichtig ist, kannst du es vor der Antwort anzeigen lassen.</li>
                </ul>
              </TutorialStep>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="uploading" className="mt-6">
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
        </TabsContent>
      </Tabs>

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
