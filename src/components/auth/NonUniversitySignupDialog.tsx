
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
                Die E-Mail-Adresse <strong>{email}</strong> ist keiner Universität in unserer Datenbank zugeordnet.
              </p>
              <p>
                Mit einem Standard-Konto haben Sie nur Zugriff auf:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-sm text-slate-600">
                <li>Ihre selbst hochgeladenen Fragen</li>
                <li>Grundlegende Lernfunktionen</li>
              </ul>
              <p className="text-sm text-slate-600">
                <strong>Hinweis:</strong> Um Zugriff auf geteilte Universitätsfragen zu erhalten, registrieren Sie sich mit Ihrer offiziellen Uni-E-Mail-Adresse.
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
  