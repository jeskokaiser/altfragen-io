import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useUpcomingExams } from '@/hooks/useUpcomingExams';

interface UpcomingExamCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  universityId?: string | null;
}

const UpcomingExamCreateDialog: React.FC<UpcomingExamCreateDialogProps> = ({ open, onOpenChange, userId, universityId }) => {
  const { createExam } = useUpcomingExams(userId);
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !dueDate) return;
    setIsSubmitting(true);
    try {
      await createExam({
        title,
        due_date: new Date(dueDate).toISOString(),
        description: description || null,
        subject: subject || null,
        created_by: userId,
        university_id: universityId ?? null
      });
      onOpenChange(false);
      setTitle('');
      setDueDate('');
      setSubject('');
      setDescription('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Neue Prüfung</DialogTitle>
          <DialogDescription>Lege eine bevorstehende Prüfung mit Fälligkeitsdatum an.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Titel</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="due">Fällig am</Label>
            <Input id="due" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="subject">Fach (optional)</Label>
            <Input id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="desc">Beschreibung (optional)</Label>
            <Textarea id="desc" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>Abbrechen</Button>
            <Button type="submit" disabled={isSubmitting}>Anlegen</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default UpcomingExamCreateDialog;


