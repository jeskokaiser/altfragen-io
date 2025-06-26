
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { deleteUserAccount } from '@/services/AccountService';
import { toast } from 'sonner';

const DeleteAccountSection: React.FC = () => {
  const { user, logout } = useAuth();
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleDeleteAccount = async () => {
    if (!user || confirmText !== 'DELETE') {
      return;
    }

    setIsDeleting(true);
    try {
      const result = await deleteUserAccount(user.id);
      
      if (result.success) {
        toast.success('Ihr Konto wurde erfolgreich gelöscht');
        await logout();
        window.location.href = '/';
      } else {
        toast.error('Fehler beim Löschen des Kontos. Bitte kontaktiere uns unter hallo@altfragen.io');
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      toast.error('Fehler beim Löschen des Kontos. Bitte kontaktiere uns unter hallo@altfragen.io');
    } finally {
      setIsDeleting(false);
      setIsDialogOpen(false);
      setConfirmText('');
    }
  };

  const isConfirmValid = confirmText === 'DELETE';

  return (
    <Card className="border-red-200 bg-red-50/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-red-700">
          <AlertTriangle className="h-5 w-5" />
          Gefahrenzone
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <h3 className="font-medium text-red-700">Konto löschen</h3>
          <p className="text-sm text-red-600">
            Diese Aktion kann nicht rückgängig gemacht werden. Alle deine privaten Fragen und persönlichen Daten werden permanent gelöscht. 
            Öffentliche Fragen bleiben erhalten, um die Community zu unterstützen.
          </p>
          <p className="text-sm text-red-600 font-medium">
            Folgende Daten werden gelöscht:
          </p>
          <ul className="text-sm text-red-600 list-disc list-inside space-y-1">
            <li>Alle privaten Fragen</li>
            <li>Dein Lernfortschritt</li>
            <li>Deine Einstellungen</li>
            <li>Dein Benutzerprofil</li>
          </ul>
          <p className="text-sm text-red-600 font-medium">
            Folgende Daten bleiben erhalten:
          </p>
          <ul className="text-sm text-red-600 list-disc list-inside">
            <li>Öffentliche Fragen (anonymisiert)</li>
          </ul>
          <p className="text-sm text-red-600">
            Bei Problemen kontaktiere uns unter: hallo@altfragen.io
          </p>
        </div>

        <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" className="w-full">
              <Trash2 className="h-4 w-4 mr-2" />
              Konto löschen
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Bist du sicher?</AlertDialogTitle>
              <AlertDialogDescription className="space-y-3">
                <p>
                  Diese Aktion kann nicht rückgängig gemacht werden. Dein Konto und alle privaten Daten werden permanent gelöscht.
                </p>
                <div className="space-y-2">
                  <Label htmlFor="confirm-delete">
                    Gib "DELETE" ein, um zu bestätigen:
                  </Label>
                  <Input
                    id="confirm-delete"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    placeholder="DELETE"
                    disabled={isDeleting}
                  />
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>
                Abbrechen
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteAccount}
                disabled={!isConfirmValid || isDeleting}
                className="bg-red-600 hover:bg-red-700"
              >
                {isDeleting ? 'Lösche...' : 'Konto endgültig löschen'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
};

export default DeleteAccountSection;
