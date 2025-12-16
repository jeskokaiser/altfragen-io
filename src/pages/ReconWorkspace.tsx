import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft, Plus, Users, CheckCircle2, Clock, AlertCircle, Loader2, Calendar, Database } from 'lucide-react';

import { ExamReconService } from '@/services/ExamReconService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ReconHeader } from '@/components/recon/ReconHeader';
import { ReconEmptyState } from '@/components/recon/ReconEmptyState';
import { SlotCard } from '@/components/recon/SlotCard';
import { ProgressCard } from '@/components/recon/ProgressCard';
import type { ExamReconTaskStatus } from '@/types/ExamRecon';

const ReconWorkspace: React.FC = () => {
  const { workspaceId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [variantCode, setVariantCode] = useState('A');
  const [variantCount, setVariantCount] = useState('100');
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);

  if (!workspaceId) return null;

  const workspaceQuery = useQuery({
    queryKey: ['exam-recon', 'workspace', workspaceId],
    queryFn: () => ExamReconService.getWorkspace(workspaceId),
  });

  const variantsQuery = useQuery({
    queryKey: ['exam-recon', 'variants', workspaceId],
    queryFn: () => ExamReconService.listVariants(workspaceId),
  });

  const selectedVariant = useMemo(() => {
    const variants = variantsQuery.data ?? [];
    if (variants.length === 0) return null;
    return variants.find((v) => v.id === selectedVariantId) ?? variants[0];
  }, [variantsQuery.data, selectedVariantId]);

  useEffect(() => {
    if (!selectedVariantId && variantsQuery.data && variantsQuery.data.length > 0) {
      setSelectedVariantId(variantsQuery.data[0].id);
    }
  }, [variantsQuery.data, selectedVariantId]);

  const slotsQuery = useQuery({
    queryKey: ['exam-recon', 'slots', selectedVariant?.id],
    queryFn: () => ExamReconService.listSlotsByVariant(selectedVariant!.id),
    enabled: !!selectedVariant?.id,
  });

  const allSlotsQuery = useQuery({
    queryKey: ['exam-recon', 'slots-all', workspaceId],
    queryFn: () => ExamReconService.listAllSlotsForWorkspace(workspaceId),
  });

  const tasksQuery = useQuery({
    queryKey: ['exam-recon', 'tasks', workspaceId],
    queryFn: () => ExamReconService.listTasks(workspaceId),
  });

  useEffect(() => {
    let cleanup: null | (() => void) = null;
    (async () => {
      cleanup = await ExamReconService.subscribeToWorkspace(workspaceId, {
        onTaskChange: () => {
          queryClient.invalidateQueries({ queryKey: ['exam-recon', 'tasks', workspaceId] });
        },
        onSlotChange: () => {
          if (selectedVariant?.id) queryClient.invalidateQueries({ queryKey: ['exam-recon', 'slots', selectedVariant.id] });
        },
      });
    })();
    return () => cleanup?.();
  }, [workspaceId, queryClient, selectedVariant?.id]);

  const handleCreateVariant = async () => {
    try {
      const count = Math.max(1, Number(variantCount));
      const v = await ExamReconService.createVariant({
        workspace_id: workspaceId,
        code: variantCode.trim() || 'A',
        question_count: count,
      });
      await ExamReconService.bulkCreateSlots(v.id, count);
      toast.success(`Variante ${v.code} erstellt`);
      setVariantCode('');
      setVariantCount('100');
      await queryClient.invalidateQueries({ queryKey: ['exam-recon', 'variants', workspaceId] });
      setSelectedVariantId(v.id);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message ?? 'Fehler beim Erstellen der Variante');
    }
  };

  const workspace = workspaceQuery.data;
  const variants = variantsQuery.data ?? [];
  const slots = slotsQuery.data ?? [];
  const allSlots = allSlotsQuery.data ?? [];
  const tasks = tasksQuery.data ?? [];

  const summary = useMemo(() => {
    const totalSlots = allSlots.length;
    const completeSlots = allSlots.filter((s) => s.status === 'complete' || s.status === 'auto_linked').length;
    const pct = totalSlots > 0 ? Math.round((completeSlots / totalSlots) * 100) : 0;

    const byUser: Record<string, { total: number; done: number; inProgress: number; stale: number }> = {};
    for (const t of tasks) {
      const key = t.assigned_to ?? 'unassigned';
      byUser[key] ??= { total: 0, done: 0, inProgress: 0, stale: 0 };
      byUser[key].total += 1;
      if (t.status === 'done') byUser[key].done += 1;
      if (t.status === 'in_progress' || t.status === 'assigned' || t.status === 'submitted') byUser[key].inProgress += 1;
      if (t.status === 'stale') byUser[key].stale += 1;
    }

    const staleTasks = tasks.filter((t) => t.status === 'stale');

    return { totalSlots, completeSlots, pct, byUser, staleTasks };
  }, [allSlots, tasks]);

  const isDueDatePassed = useMemo(() => {
    if (!workspace?.due_at) return false;
    return new Date(workspace.due_at) < new Date();
  }, [workspace?.due_at]);

  const formatDueDate = (dueAt: string | null | undefined): string => {
    if (!dueAt) return 'Nicht festgelegt';
    const date = new Date(dueAt);
    return date.toLocaleString('de-DE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDatasetLabel = (): string => {
    if (!workspace) return 'Kein Datensatz';
    return workspace.dataset_filename || 'Kein Datensatz';
  };

  const isLoading = workspaceQuery.isLoading || variantsQuery.isLoading || allSlotsQuery.isLoading;
  const hasError = workspaceQuery.error || variantsQuery.error || allSlotsQuery.error;

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-32 w-full" />
        <div className="grid gap-4 md:grid-cols-[320px_1fr]">
          <Skeleton className="h-[70vh]" />
          <Skeleton className="h-[70vh]" />
        </div>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="container mx-auto py-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Fehler beim Laden</AlertTitle>
          <AlertDescription>
            Die Workspace-Daten konnten nicht geladen werden. Bitte versuche es später erneut.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <ReconHeader
        title={workspace?.title ?? 'Workspace'}
        subtitle={
          <>
            {workspace?.subject}
            {workspace?.exam_term ? ` • ${workspace.exam_term}` : ''}
            {workspace?.exam_year ? ` ${workspace.exam_year}` : ''}
          </>
        }
        actions={
          <>
            <Button variant="outline" onClick={() => navigate('/recon')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Zurück
            </Button>
            <Button
              onClick={() => ExamReconService.runAssignment(workspaceId).catch((e) => toast.error(e.message))}
            >
              <Users className="h-4 w-4 mr-2" />
              Aufgaben verteilen
            </Button>
            <Button
              variant="secondary"
              onClick={async () => {
                try {
                  const n = await ExamReconService.publishWorkspace(workspaceId);
                  toast.success(`Veröffentlicht: ${n} Fragen`);
                  await queryClient.invalidateQueries({ queryKey: ['exam-recon', 'workspace', workspaceId] });
                } catch (e: any) {
                  console.error(e);
                  toast.error(e?.message ?? 'Veröffentlichung fehlgeschlagen');
                }
              }}
            >
              Veröffentlichen
            </Button>
          </>
        }
      />

      {/* Exam due date and dataset info */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Prüfungsdatum
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-sm">
                <span className="text-muted-foreground">Datum und Zeit:</span>{' '}
                <span className="font-medium">{formatDueDate(workspace?.due_at)}</span>
              </div>
              {isDueDatePassed && (
                <Badge variant="destructive" className="text-xs">
                  Prüfung bereits stattgefunden
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Database className="h-4 w-4" />
              Verknüpfter Datensatz
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm">
              <div className="font-medium">{formatDatasetLabel()}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {summary.totalSlots > 0 && (
        <ProgressCard
          current={summary.completeSlots}
          total={summary.totalSlots}
          label="Gesamtfortschritt"
          description={`${summary.completeSlots} von ${summary.totalSlots} Fragen erfasst`}
        />
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Prüfungsvarianten</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3 sm:items-end">
          <div className="grid gap-2">
            <Label htmlFor="variant-code">Varianten-Code</Label>
            <Input
              id="variant-code"
              value={variantCode}
              onChange={(e) => setVariantCode(e.target.value)}
              placeholder="A"
              maxLength={5}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="variant-count">Anzahl Fragen</Label>
            <Input
              id="variant-count"
              value={variantCount}
              onChange={(e) => setVariantCount(e.target.value)}
              inputMode="numeric"
              placeholder="100"
            />
          </div>
          <div>
            <Button
              onClick={handleCreateVariant}
              disabled={!variantCode.trim() || !variantCount.trim()}
              className="w-full sm:w-auto"
            >
              <Plus className="h-4 w-4 mr-2" />
              Variante anlegen
            </Button>
          </div>
        </CardContent>
      </Card>

      {variants.length === 0 ? (
        <ReconEmptyState
          title="Noch keine Varianten angelegt"
          description="Lege eine Prüfungsvariante an, um mit der Rekonstruktion zu beginnen."
          actionLabel="Erste Variante anlegen"
          onAction={() => {
            // Focus auf das Varianten-Formular
            document.getElementById('variant-code')?.focus();
          }}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-[320px_1fr]">
          <Card className="h-[70vh] overflow-hidden flex flex-col">
            <CardHeader className="space-y-2 flex-shrink-0">
              <CardTitle className="text-base">Fragen</CardTitle>
              <div className="flex flex-wrap gap-2">
                {variants.map((v) => (
                  <Button
                    key={v.id}
                    variant={selectedVariant?.id === v.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedVariantId(v.id)}
                  >
                    {v.code} ({v.question_count})
                  </Button>
                ))}
              </div>
            </CardHeader>
            <Separator />
            <CardContent className="p-0 flex-1 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="divide-y">
                  {slots.length === 0 ? (
                    <div className="p-4 text-sm text-muted-foreground text-center">
                      Keine Fragen in dieser Variante.
                    </div>
                  ) : (
                    slots.map((s) => (
                      <SlotCard
                        key={s.id}
                        slot={s}
                        variantCode={selectedVariant?.code ?? ''}
                        onClick={() => navigate(`/recon/${workspaceId}/slot/${s.id}`)}
                      />
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          <Card className="h-[70vh] overflow-hidden flex flex-col">
            <CardHeader className="flex-shrink-0">
              <CardTitle className="text-base">Übersicht</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 overflow-y-auto">
              {selectedVariant && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="text-muted-foreground">Fortschritt (Variante {selectedVariant.code})</div>
                    <div className="font-medium">
                      {slots.filter((s) => s.status === 'complete' || s.status === 'auto_linked').length}/
                      {slots.length} ({slots.length > 0 ? Math.round((slots.filter((s) => s.status === 'complete' || s.status === 'auto_linked').length / slots.length) * 100) : 0}%)
                    </div>
                  </div>
                  <Separator />
                </div>
              )}

              <div className="space-y-2">
                <div className="text-sm font-medium flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Fortschritt nach Nutzer
                </div>
                <div className="space-y-2">
                  {Object.entries(summary.byUser)
                    .sort((a, b) => (b[1].done - a[1].done) || (b[1].total - a[1].total))
                    .slice(0, 12)
                    .map(([uid, s]) => (
                      <div key={uid} className="flex items-center justify-between text-sm">
                        <div className="text-muted-foreground">
                          {uid === 'unassigned' ? 'Nicht zugewiesen' : `${uid.slice(0, 8)}…`}
                        </div>
                        <div className="font-medium flex items-center gap-2">
                          <span>
                            {s.done}/{s.total}
                          </span>
                          {s.stale > 0 && (
                            <Badge variant="outline" className="text-xs">
                              {s.stale} abgelaufen
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
                {Object.keys(summary.byUser).length > 12 && (
                  <div className="text-xs text-muted-foreground">… weitere Nutzer vorhanden</div>
                )}
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Abgelaufene Aufgaben
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      try {
                        const n = await ExamReconService.markStaleTasks(workspaceId, 24);
                        toast.success(`${n} Aufgaben zurückgesetzt`);
                        await queryClient.invalidateQueries({ queryKey: ['exam-recon', 'tasks', workspaceId] });
                      } catch (e: any) {
                        console.error(e);
                        toast.error(e?.message ?? 'Fehler beim Zurücksetzen');
                      }
                    }}
                  >
                    Zurücksetzen
                  </Button>
                </div>
                {summary.staleTasks.length === 0 ? (
                  <div className="text-sm text-muted-foreground">Keine abgelaufenen Aufgaben.</div>
                ) : (
                  <div className="space-y-1 text-sm">
                    {summary.staleTasks.slice(0, 10).map((t) => (
                      <div key={t.id} className="flex items-center justify-between">
                        <div className="text-muted-foreground">{t.slot_id.slice(0, 8)}…</div>
                        <Badge variant="outline" className="text-xs">Abgelaufen</Badge>
                      </div>
                    ))}
                    {summary.staleTasks.length > 10 && (
                      <div className="text-xs text-muted-foreground">… weitere abgelaufene Aufgaben</div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ReconWorkspace;
