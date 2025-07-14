import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Question } from '@/types/Question';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { FormData } from './types/FormData';
import { QuestionField } from './edit-question/QuestionField';
import { OptionsFields } from './edit-question/OptionsFields';
import { SubjectField } from './edit-question/SubjectField';
import { DifficultyField } from './edit-question/DifficultyField';
import { useAuth } from '@/contexts/AuthContext';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { GraduationCap, Lock, Image, Trash2 } from 'lucide-react';
import QuestionImage from '@/components/questions/QuestionImage';

interface EditQuestionModalProps {
  question: Question;
  isOpen: boolean;
  onClose: () => void;
  onQuestionUpdated: (updatedQuestion: Question) => void;
}

const EditQuestionModal: React.FC<EditQuestionModalProps> = ({
  question,
  isOpen,
  onClose,
  onQuestionUpdated
}) => {
  const {
    register,
    handleSubmit,
    formState: {
      isSubmitting
    },
    reset,
    setValue,
    watch
  } = useForm<FormData>();
  
  const correctAnswer = watch('correctAnswer');
  const [visibility, setVisibility] = useState<'private' | 'university'>(
    (question.visibility as 'private' | 'university') || 'private'
  );
  const [showImageAfterAnswer, setShowImageAfterAnswer] = useState<boolean>(
    question.show_image_after_answer || false
  );
  const [imageToRemove, setImageToRemove] = useState<boolean>(false);
  const { user, universityId } = useAuth();
  
  useEffect(() => {
    if (question) {
      reset({
        question: question.question,
        optionA: question.optionA,
        optionB: question.optionB,
        optionC: question.optionC,
        optionD: question.optionD,
        optionE: question.optionE,
        correctAnswer: question.correctAnswer,
        comment: question.comment,
        subject: question.subject,
        difficulty: question.difficulty?.toString() || '3'
      });
      setVisibility((question.visibility as 'private' | 'university') || 'private');
      setShowImageAfterAnswer(question.show_image_after_answer || false);
      setImageToRemove(false);
    }
  }, [question, reset]);

  const onSubmit = async (data: FormData) => {
    try {
      if (question.visibility === 'university' && visibility === 'private') {
        toast.error('Fragen, die mit deiner Universität geteilt wurden, können nicht zurück auf privat gesetzt werden.');
        return;
      }

      const updateData: any = {
        question: data.question,
        option_a: data.optionA,
        option_b: data.optionB,
        option_c: data.optionC,
        option_d: data.optionD,
        option_e: data.optionE,
        correct_answer: data.correctAnswer,
        comment: data.comment,
        subject: data.subject,
        difficulty: parseInt(data.difficulty),
        visibility: visibility,
        show_image_after_answer: showImageAfterAnswer
      };

      // Handle image removal
      if (imageToRemove && question.image_key) {
        updateData.image_key = null;
        
        // Optionally delete the image from storage
        try {
          const { error: deleteError } = await supabase.storage
            .from('exam-images')
            .remove([question.image_key]);
          
          if (deleteError) {
            console.warn('Warning: Could not delete image from storage:', deleteError);
            // Don't fail the update if storage deletion fails
          }
        } catch (storageError) {
          console.warn('Warning: Could not delete image from storage:', storageError);
        }
      }

      const {
        data: updatedQuestion,
        error
      } = await supabase.from('questions').update(updateData).eq('id', question.id).select().single();

      if (error) {
        console.error('Error updating question:', error);
        throw error;
      }

      if (updatedQuestion) {
        const mappedQuestion: Question = {
          id: updatedQuestion.id,
          question: updatedQuestion.question,
          optionA: updatedQuestion.option_a,
          optionB: updatedQuestion.option_b,
          optionC: updatedQuestion.option_c,
          optionD: updatedQuestion.option_d,
          optionE: updatedQuestion.option_e,
          correctAnswer: updatedQuestion.correct_answer,
          comment: updatedQuestion.comment,
          subject: updatedQuestion.subject,
          filename: updatedQuestion.filename,
          difficulty: updatedQuestion.difficulty,
          university_id: updatedQuestion.university_id,
          visibility: updatedQuestion.visibility as 'private' | 'university',
          image_key: updatedQuestion.image_key,
          show_image_after_answer: updatedQuestion.show_image_after_answer,
          semester: updatedQuestion.exam_semester,
          year: updatedQuestion.exam_year,
          created_at: updatedQuestion.created_at,
          exam_name: updatedQuestion.exam_name,
          user_id: updatedQuestion.user_id,
          is_unclear: updatedQuestion.is_unclear,
          marked_unclear_at: updatedQuestion.marked_unclear_at,
          ai_commentary_status: updatedQuestion.ai_commentary_status,
          ai_commentary_queued_at: updatedQuestion.ai_commentary_queued_at,
          ai_commentary_processed_at: updatedQuestion.ai_commentary_processed_at
        };
        onQuestionUpdated(mappedQuestion);
        toast.info('Frage erfolgreich aktualisiert');
        onClose();
      }
    } catch (error: any) {
      console.error('Error updating question:', error);
      toast.error('Fehler beim Aktualisieren der Frage');
    }
  };

  const handleMoveToComment = () => {
    const currentComment = watch('comment') || '';
    setValue('comment', `${correctAnswer}\n${currentComment}`);
    setValue('correctAnswer', '');
  };

  const handleRemoveImage = () => {
    setImageToRemove(true);
  };

  const handleCancelRemoveImage = () => {
    setImageToRemove(false);
  };

  const canChangeVisibility = question.university_id === null || 
                              (user && user.id === question.user_id);
                              
  const canChangeToPrivate = question.visibility !== 'university';

  return <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Frage bearbeiten</DialogTitle>
          <DialogDescription>Denke daran, die Änderungen zu speichern.</DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[calc(90vh-8rem)] pr-4">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <QuestionField register={register} />
            <OptionsFields register={register} />
            
            <div>
              <Label htmlFor="correctAnswer">Richtige Antwort</Label>
              <div className="flex gap-2">
                <Input id="correctAnswer" {...register('correctAnswer')} />
                <Button type="button" variant="outline" onClick={handleMoveToComment} size="icon" title="Antwort in Kommentar übernehmen">
                  ↓
                </Button>
              </div>
            </div>

            <DifficultyField defaultValue={question.difficulty?.toString() || '3'} onValueChange={value => setValue('difficulty', value)} />

            <div>
              <Label htmlFor="comment">Kommentar</Label>
              <Textarea id="comment" {...register('comment')} />
            </div>

            <SubjectField defaultValue={question.subject} onValueChange={value => setValue('subject', value)} />
            
            {question.image_key && !imageToRemove && (
              <div className="space-y-4">
                <div className="flex items-center justify-between space-x-2">
                  <div className="flex items-center space-x-2">
                    <Image className="h-4 w-4 text-blue-500" />
                    <Label htmlFor="showImageAfterAnswer" className="text-sm font-medium">
                      Bild nach Antwort anzeigen
                    </Label>
                  </div>
                  <Switch
                    id="showImageAfterAnswer"
                    checked={showImageAfterAnswer}
                    onCheckedChange={setShowImageAfterAnswer}
                  />
                  <span className="text-xs text-muted-foreground">
                    {showImageAfterAnswer ? 'Bild wird nach der Antwort angezeigt' : 'Bild wird sofort angezeigt'}
                  </span>
                </div>
                
                <div className="space-y-2">
                  <Label>Aktuelles Bild</Label>
                  <QuestionImage imageKey={question.image_key} />
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm" className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50">
                        <Trash2 className="h-4 w-4" />
                        Bild entfernen
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Bild entfernen</AlertDialogTitle>
                        <AlertDialogDescription>
                          Sind Sie sicher, dass Sie das Bild von dieser Frage entfernen möchten? Diese Aktion kann nicht rückgängig gemacht werden.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                        <AlertDialogAction onClick={handleRemoveImage} className="bg-red-600 hover:bg-red-700">
                          Bild entfernen
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            )}

            {imageToRemove && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Trash2 className="h-4 w-4 text-red-600" />
                    <span className="text-sm font-medium text-red-600">Bild wird entfernt</span>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleCancelRemoveImage}>
                    Rückgängig
                  </Button>
                </div>
                <p className="text-xs text-red-600 mt-1">
                  Das Bild wird beim Speichern der Frage entfernt.
                </p>
              </div>
            )}
            
            <div>
              <Label htmlFor="visibility">Sichtbarkeit</Label>
              {question.visibility === 'university' ? (
                <div className="flex items-center mt-2">
                  <GraduationCap className="h-5 w-5 text-blue-500 mr-2" />
                  <span>Mit deiner Universität geteilt (kann nicht geändert werden)</span>
                </div>
              ) : (
                <Select 
                  disabled={!canChangeVisibility}
                  value={visibility} 
                  onValueChange={(value: 'private' | 'university') => setVisibility(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sichtbarkeit wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="private">
                      <div className="flex items-center gap-2">
                        <Lock className="h-4 w-4" />
                        <span>Privat (nur für dich)</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="university" disabled={!universityId}>
                      <div className="flex items-center gap-2">
                        <GraduationCap className="h-4 w-4" />
                        <span>Universität (alle an deiner Uni)</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              )}
              {question.visibility !== 'university' && (
                <p className="text-sm text-muted-foreground mt-1">
                  Hinweis: Wenn du diese Frage mit deiner Universität teilst, kann die Sichtbarkeit nicht mehr zurück auf privat gesetzt werden.
                </p>
              )}
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Abbrechen
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                Speichern
              </Button>
            </div>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>;
};

export default EditQuestionModal;
