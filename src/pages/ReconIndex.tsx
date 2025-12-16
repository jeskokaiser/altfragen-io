import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2, AlertCircle, Plus } from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';
import { useUniversityModerator } from '@/hooks/useUniversityModerator';
import { ExamReconService } from '@/services/ExamReconService';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { ReconHeader } from '@/components/recon/ReconHeader';
import { ReconEmptyState } from '@/components/recon/ReconEmptyState';
import DatasetSelector from '@/components/recon/DatasetSelector';
import type { ExamReconWorkspaceStatus } from '@/types/ExamRecon';
import type { Dataset } from '@/services/DatasetService';

const statusLabels: Record<ExamReconWorkspaceStatus, string> = {
  draft: 'Entwurf',
  active: 'Aktiv',
  published: 'Veröffentlicht',
  archived: 'Archiviert',
};

const statusVariants: Record<ExamReconWorkspaceStatus, 'default' | 'secondary' | 'outline'> = {
  draft: 'outline',
  active: 'default',
  published: 'secondary',
  archived: 'outline',
};

const ReconIndex: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, universityId, isEmailVerified } = useAuth();
  const { isModerator, loading: moderatorLoading } = useUniversityModerator();

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [examTerm, setExamTerm] = useState('');
  const [examYear, setExamYear] = useState('');
  const [dueAt, setDueAt] = useState('');
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);

  const canCreate = !!user && !!universityId && isEmailVerified && isModerator;

  const { data: workspaces, isLoading, error } = useQuery({
    queryKey: ['exam-recon', 'workspaces'],
    queryFn: () => ExamReconService.listWorkspaces(),
    enabled: !!user,
  });

  const sorted = useMemo(() => {
    return (workspaces ?? []).slice().sort((a, b) => (a.updated_at < b.updated_at ? 1 : -1));
  }, [workspaces]);

  // Convert datetime-local string to ISO string (local time to UTC)
  const convertDateTimeLocalToISO = (datetimeLocal: string): string => {
    if (!datetimeLocal) return '';
    
    const [datePart, timePart] = datetimeLocal.split('T');
    if (!datePart || !timePart) {
      return datetimeLocal;
    }
    
    const [year, month, day] = datePart.split('-').map(Number);
    const [hours, minutes] = timePart.split(':').map(Number);
    
    const localDate = new Date(year, month - 1, day, hours, minutes || 0, 0, 0);
    
    if (isNaN(localDate.getTime())) {
      return datetimeLocal;
    }
    
    return localDate.toISOString();
  };

  const handleCreate = async () => {
    if (!user || !universityId || !selectedDataset || !dueAt) return;
    
    try {
      const ws = await ExamReconService.createWorkspace({
        university_id: universityId,
        title: title.trim(),
        subject: subject.trim(),
        exam_term: examTerm.trim() || null,
        exam_year: examYear.trim() ? Number(examYear.trim()) : null,
        created_by: user.id,
        status: 'draft',
        due_at: convertDateTimeLocalToISO(dueAt),
        dataset_filename: selectedDataset.exam_name,
        dataset_semester: null,
        dataset_year: null,
        dataset_subject: null,
      });

      // Bootstraps creator as moderator.
      await ExamReconService.addSelfAsModerator(ws.id, user.id);

      toast.success('Rekonstruktion erstellt');
      setOpen(false);
      setTitle('');
      setSubject('');
      setExamTerm('');
      setExamYear('');
      setDueAt('');
      setSelectedDataset(null);
      await queryClient.invalidateQueries({ queryKey: ['exam-recon', 'workspaces'] });
      navigate(`/recon/${ws.id}`);
    } catch (e: any) {
      console.error(e);
      
      // Check if it's a permission error (RLS policy violation)
      if (e?.code === '42501' || e?.message?.includes('permission') || e?.message?.includes('policy')) {
        toast.error('Du hast keine Berechtigung, Rekonstruktionen zu erstellen. Nur Moderatoren können Rekonstruktionen anlegen.');
      } else {
        toast.error(e?.message ?? 'Rekonstruktion konnte nicht erstellt werden');
      }
    }
  };

  if (isLoading || moderatorLoading) {
    return (
      <div className="container mx-auto py-8 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Fehler beim Laden</AlertTitle>
          <AlertDescription>
            Die Rekonstruktionen konnten nicht geladen werden. Bitte versuche es später erneut.
            {(error as any)?.message && (
              <span className="block mt-1">{(error as any).message}</span>
            )}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <ReconHeader
        title="Prüfungsrekonstruktion"
        subtitle="Nach der Prüfung gemeinsam Fragen rekonstruieren, diskutieren und als Set veröffentlichen."
        actions={
          isModerator && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button disabled={!canCreate}>
                  <Plus className="h-4 w-4 mr-2" />
                  Neue Rekonstruktion erstellen
                </Button>
              </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Neue Rekonstruktion anlegen</DialogTitle>
              </DialogHeader>

              {!canCreate && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Berechtigung erforderlich</AlertTitle>
                  <AlertDescription>
                    {!user || !universityId || !isEmailVerified ? (
                      'Du brauchst eine verifizierte Uni-Zugehörigkeit, um eine Rekonstruktion zu erstellen.'
                    ) : !isModerator ? (
                      'Nur Moderatoren können Rekonstruktionen erstellen. Kontaktiere einen Administrator, um Moderator-Rechte für deine Uni zu erhalten.'
                    ) : (
                      'Du hast keine Berechtigung, Rekonstruktionen zu erstellen.'
                    )}
                  </AlertDescription>
                </Alert>
              )}

              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="recon-title">Titel</Label>
                  <Input
                    id="recon-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="z. B. Biochem Klausur"
                    disabled={!canCreate}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="recon-subject">Fach</Label>
                  <Input
                    id="recon-subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="z. B. Biochemie"
                    disabled={!canCreate}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-2">
                    <Label htmlFor="recon-term">Semester</Label>
                    <Input
                      id="recon-term"
                      value={examTerm}
                      onChange={(e) => setExamTerm(e.target.value)}
                      placeholder="WS/SS"
                      disabled={!canCreate}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="recon-year">Jahr</Label>
                    <Input
                      id="recon-year"
                      value={examYear}
                      onChange={(e) => setExamYear(e.target.value)}
                      placeholder="2025"
                      disabled={!canCreate}
                      inputMode="numeric"
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="recon-due-at">Prüfungsdatum und -zeit *</Label>
                  <Input
                    id="recon-due-at"
                    type="datetime-local"
                    value={dueAt}
                    onChange={(e) => setDueAt(e.target.value)}
                    disabled={!canCreate}
                    required
                  />
                </div>
                {universityId && (
                  <DatasetSelector
                    universityId={universityId}
                    selectedDataset={selectedDataset}
                    onSelectDataset={setSelectedDataset}
                    disabled={!canCreate}
                  />
                )}
              </div>

              <DialogFooter>
                <Button
                  onClick={handleCreate}
                  disabled={!canCreate || !title.trim() || !subject.trim() || !dueAt || !selectedDataset}
                >
                  Erstellen
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          )
        }
      />

      {sorted.length === 0 ? (
        isModerator ? (
          <ReconEmptyState
            title="Noch keine Rekonstruktionen vorhanden"
            description="Erstelle deine erste Rekonstruktion, um gemeinsam mit anderen Prüfungsfragen zu erfassen und zu diskutieren."
            actionLabel="Neue Rekonstruktion erstellen"
            onAction={() => setOpen(true)}
            icon={<Plus className="h-12 w-12" />}
          />
        ) : (
          <ReconEmptyState
            title="Noch keine Rekonstruktionen vorhanden"
            description="Es gibt noch keine Rekonstruktionen für deine Uni. Kontaktiere einen Moderator, um eine Rekonstruktion zu erstellen."
          />
        )
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((w) => (
            <Card
              key={w.id}
              className="cursor-pointer hover:bg-accent/40 transition-colors"
              onClick={() => navigate(`/recon/${w.id}`)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  navigate(`/recon/${w.id}`);
                }
              }}
              aria-label={`Rekonstruktion ${w.title} öffnen`}
            >
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base">{w.title}</CardTitle>
                  <Badge variant={statusVariants[w.status]}>
                    {statusLabels[w.status]}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="text-muted-foreground">
                  <span className="font-medium">Fach:</span> {w.subject}
                </div>
                {(w.exam_term || w.exam_year) && (
                  <div className="text-muted-foreground">
                    {w.exam_term ? `${w.exam_term} ` : ''}
                    {w.exam_year ?? ''}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReconIndex;
