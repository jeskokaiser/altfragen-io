import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useUpcomingExams } from '@/hooks/useUpcomingExams';
import { UpcomingExam } from '@/types/UpcomingExam';
import { toast } from 'sonner';

interface UpcomingExamEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exam: UpcomingExam | null;
  userId: string;
}

const UpcomingExamEditDialog: React.FC<UpcomingExamEditDialogProps> = ({ open, onOpenChange, exam, userId }) => {
  const { updateExam } = useUpcomingExams(userId);
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update form fields when exam changes
  useEffect(() => {
    if (exam) {
      setTitle(exam.title);
      // Convert ISO date to YYYY-MM-DD format for input
      const dateObj = new Date(exam.due_date);
      const formattedDate = dateObj.toISOString().split('T')[0];
      setDueDate(formattedDate);
      setSubject(exam.subject || '');
      setDescription(exam.description || '');
    }
  }, [exam]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!exam || !title || !dueDate) return;
    
    setIsSubmitting(true);
    try {
      await updateExam({ 
        examId: exam.id, 
        updates: {
          title,
          due_date: new Date(dueDate).toISOString(),
          description: description || null,
          subject: subject || null,
        }
      });
      toast.success('Prüfung aktualisiert');
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating exam:', error);
      toast.error('Fehler beim Aktualisieren der Prüfung');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!exam) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Prüfung bearbeiten</DialogTitle>
          <DialogDescription>Bearbeite die Details der Prüfung.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-title">Titel</Label>
            <Input 
              id="edit-title" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              required 
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-due">Fällig am</Label>
            <Input 
              id="edit-due" 
              type="date" 
              value={dueDate} 
              onChange={(e) => setDueDate(e.target.value)} 
              required 
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-subject">Fach (optional)</Label>
            <Input 
              id="edit-subject" 
              value={subject} 
              onChange={(e) => setSubject(e.target.value)} 
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-desc">Beschreibung (optional)</Label>
            <Textarea 
              id="edit-desc" 
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)} 
              disabled={isSubmitting}
            >
              Abbrechen
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              Speichern
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default UpcomingExamEditDialog;

