
import { useState } from 'react';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { updateQuestionVisibility } from '@/services/DatabaseService';
import { toast } from 'sonner';
import { Share } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface ShareQuestionDialogProps {
  questionId: string;
  currentVisibility?: 'private' | 'university';
  onVisibilityChange?: (visibility: 'private' | 'university') => void;
}

const ShareQuestionDialog = ({ 
  questionId, 
  currentVisibility = 'private',
  onVisibilityChange 
}: ShareQuestionDialogProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { universityId, isEmailVerified } = useAuth();
  
  const handleVisibilityChange = async (visibility: 'private' | 'university') => {
    if (!universityId || !isEmailVerified) {
      toast.error('Bitte verifizieren Sie Ihre E-Mail-Adresse, um Fragen zu teilen.');
      return;
    }
    
    setIsSubmitting(true);
    try {
      await updateQuestionVisibility(questionId, visibility);
      toast.success(
        visibility === 'university' 
          ? 'Frage erfolgreich mit Ihrer Universität geteilt.' 
          : 'Frage wurde auf privat gesetzt.'
      );
      if (onVisibilityChange) {
        onVisibilityChange(visibility);
      }
    } catch (error) {
      console.error('Error updating question visibility:', error);
      toast.error('Fehler beim Ändern der Sichtbarkeit der Frage.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Don't render if user is not verified or doesn't have a university
  if (!universityId || !isEmailVerified) {
    return null;
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button 
          variant={currentVisibility === 'university' ? 'default' : 'outline'}
          size="sm"
        >
          <Share className="h-4 w-4 mr-2" />
          {currentVisibility === 'university' ? 'Geteilt' : 'Teilen'}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {currentVisibility === 'university' 
              ? 'Freigabe der Frage entfernen?' 
              : 'Frage mit Ihrer Universität teilen?'}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {currentVisibility === 'university' 
              ? 'Die Frage wird nicht mehr für andere Studierende Ihrer Universität sichtbar sein.' 
              : 'Die Frage wird für alle verifizierten Studierenden Ihrer Universität sichtbar sein.'}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Abbrechen</AlertDialogCancel>
          <AlertDialogAction 
            onClick={() => handleVisibilityChange(
              currentVisibility === 'university' ? 'private' : 'university'
            )}
            disabled={isSubmitting}
          >
            {isSubmitting 
              ? 'Wird bearbeitet...' 
              : (currentVisibility === 'university' ? 'Privat setzen' : 'Mit Universität teilen')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ShareQuestionDialog;
