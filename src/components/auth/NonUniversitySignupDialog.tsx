
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
  } from "@/components/ui/alert-dialog";
  import { AlertTriangle } from "lucide-react";
  
  interface NonUniversitySignupDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
    email: string;
  }
  
  export const NonUniversitySignupDialog = ({
    open,
    onOpenChange,
    onConfirm,
    email
  }: NonUniversitySignupDialogProps) => {
    return (
      <AlertDialog open={open} onOpenChange={onOpenChange}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <AlertDialogTitle>Standard-Konto erstellen</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-left space-y-3">
              <p>
                Die E-Mail-Adresse <strong>{email}</strong> ist keiner Universität in unserer Datenbank zugeordnet. Wenn wir deine Universität in unser System aufnehmen sollen, melde dich bitte unter <a href="mailto:hallo@altfragen.io" className="text-blue-500 hover:text-blue-600">hallo@altfragen.io</a>.
              </p>
              <p>
                Mit einem Standard-Konto hast du nur Zugriff auf:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-sm text-slate-600">
                <li>Deine selbst hochgeladenen Fragen</li>
                <li>Grundlegende Lernfunktionen</li>
              </ul>
              <p className="text-sm text-slate-600">
                <strong>Hinweis:</strong> <br />Um Zugriff auf 
                <ul className="list-disc pl-5 space-y-1 text-sm text-slate-600">
                <li>fortlaufend studentisch gepflegte, geteilte Universitätsfragen</li>
                <li>KI-Kommentare zu den Fragen und Antworten</li>
                <li>Kommentare zu den Fragen von deinen Kommiliton:innen</li>
              </ul>zu erhalten, registriere dich mit deiner offiziellen Uni-E-Mail-Adresse.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col-reverse sm:flex-row gap-2">
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={onConfirm}>
              Trotzdem registrieren
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  };
  