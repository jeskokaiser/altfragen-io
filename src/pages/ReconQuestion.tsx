import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Save, RefreshCw, CheckCircle2, Image, MessageSquare, Vote, GitMerge, GitBranch, AlertCircle, Loader2, X } from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';
import { ExamReconService } from '@/services/ExamReconService';
import type { ExamReconDraftContent, ExamReconQuestionDraft } from '@/types/ExamRecon';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { ReconHeader } from '@/components/recon/ReconHeader';
import { PresenceIndicator } from '@/components/recon/PresenceIndicator';

const ReconQuestion: React.FC = () => {
  const { workspaceId, canonicalId } = useParams();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const [draft, setDraft] = useState<ExamReconQuestionDraft | null>(null);
  const [localContent, setLocalContent] = useState<ExamReconDraftContent>({});
  const [isSaving, setIsSaving] = useState(false);
  const [hasConflict, setHasConflict] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [presenceCount, setPresenceCount] = useState<{ viewing: number; editing: number }>({ viewing: 0, editing: 0 });
  const [attachmentUrls, setAttachmentUrls] = useState<Record<string, string>>({});
  const [comments, setComments] = useState<any[]>([]);
  const [votes, setVotes] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [freeTextVote, setFreeTextVote] = useState('');
  const [similar, setSimilar] = useState<Array<{ candidate_id: string; similarity: number; normalized_prompt: string }>>([]);
  const [canonicalRow, setCanonicalRow] = useState<any | null>(null);
  const [mergeReason, setMergeReason] = useState('');

  const lastRevisionRef = useRef<number>(0);
  const saveTimerRef = useRef<number | null>(null);
  const slotId = searchParams.get('slot');

  const prompt = useMemo(() => localContent.prompt ?? '', [localContent.prompt]);
  const explanation = useMemo(() => localContent.solution_explanation ?? '', [localContent.solution_explanation]);

  useEffect(() => {
    if (!canonicalId) return;
    let alive = true;
    setIsLoading(true);
    (async () => {
      try {
        const cq = await ExamReconService.getCanonicalQuestion(canonicalId);
        if (!alive) return;
        setCanonicalRow(cq);

        const d = await ExamReconService.getDraft(canonicalId);
        if (!alive) return;
        if (d) {
          setDraft(d);
          setLocalContent((d.content ?? {}) as ExamReconDraftContent);
          lastRevisionRef.current = d.revision ?? 0;
          setIsDirty(false);
        } else {
          setDraft(null);
          setLocalContent({});
          lastRevisionRef.current = 0;
          setIsDirty(false);
        }
      } catch (e: any) {
        console.error(e);
        toast.error(e?.message ?? 'Fehler beim Laden');
      } finally {
        if (alive) setIsLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [canonicalId]);

  useEffect(() => {
    if (!workspaceId || !canonicalId) return;
    let alive = true;
    (async () => {
      try {
        const sims = await ExamReconService.findSimilarCanonicals({ workspaceId, canonicalId, threshold: 0.7, limit: 8 });
        if (!alive) return;
        setSimilar(sims.map((s) => ({ candidate_id: s.candidate_id, similarity: s.similarity, normalized_prompt: s.normalized_prompt })));
      } catch {
        // ignore
      }
    })();
    return () => {
      alive = false;
    };
  }, [workspaceId, canonicalId]);

  // Comments + votes initial load
  useEffect(() => {
    if (!canonicalId) return;
    let alive = true;
    (async () => {
      try {
        const [c, v] = await Promise.all([
          ExamReconService.listComments(canonicalId),
          ExamReconService.listVotes(canonicalId),
        ]);
        if (!alive) return;
        setComments(c as any[]);
        setVotes(v as any[]);
      } catch {
        // ignore
      }
    })();
    return () => {
      alive = false;
    };
  }, [canonicalId]);

  useEffect(() => {
    if (!workspaceId || !canonicalId || !user) return;
    // heartbeat while viewing/editing
    const tick = async () => {
      try {
        await ExamReconService.upsertPresence({
          workspace_id: workspaceId,
          canonical_question_id: canonicalId,
          user_id: user.id,
          status: isDirty ? 'editing' : 'viewing',
        });
      } catch {
        // ignore
      }
    };
    tick();
    const interval = window.setInterval(tick, 20_000);
    return () => window.clearInterval(interval);
  }, [workspaceId, canonicalId, user, isDirty]);

  useEffect(() => {
    if (!canonicalId) return;
    const unsub = ExamReconService.subscribeToCanonicalQuestion(canonicalId, {
      onDraftChange: async (payload) => {
        if (payload?.new) {
          const newDraft = payload.new as ExamReconQuestionDraft;
          setDraft(newDraft);
          if (newDraft.revision !== lastRevisionRef.current) {
            // Keep user typing stable; only hard-refresh when not saving.
          }
        }
      },
      onCommentChange: async () => {
        try {
          const c = await ExamReconService.listComments(canonicalId);
          setComments(c as any[]);
        } catch {
          // ignore
        }
      },
      onVoteChange: async () => {
        try {
          const v = await ExamReconService.listVotes(canonicalId);
          setVotes(v as any[]);
        } catch {
          // ignore
        }
      },
      onPresenceChange: (payload) => {
        const row = (payload?.new ?? payload?.old) as any;
        if (!row) return;
        (async () => {
          try {
            const data = await ExamReconService.listPresenceStatusesForQuestion(canonicalId);
            const viewing = (data ?? []).filter((p: any) => p.status === 'viewing').length;
            const editing = (data ?? []).filter((p: any) => p.status === 'editing').length;
            setPresenceCount({ viewing, editing });
          } catch {
            // ignore
          }
        })();
      },
    });
    return () => unsub();
  }, [canonicalId]);

  // Autosave (debounced)
  useEffect(() => {
    if (!canonicalId || !user) return;
    if (!isDirty) return;
    if (hasConflict) return;

    if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    saveTimerRef.current = window.setTimeout(() => {
      save().catch(() => {});
    }, 2000);

    return () => {
      if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localContent, isDirty, hasConflict, canonicalId, user?.id]);

  // Create signed URLs for attachments (best-effort)
  useEffect(() => {
    if (!localContent.attachments || localContent.attachments.length === 0) return;
    let alive = true;
    (async () => {
      try {
        const urls: Record<string, string> = {};
        for (const a of localContent.attachments ?? []) {
          if (!a.storage_path) continue;
          urls[a.storage_path] = await ExamReconService.createSignedUrl(a.storage_path);
        }
        if (!alive) return;
        setAttachmentUrls(urls);
      } catch {
        // ignore
      }
    })();
    return () => {
      alive = false;
    };
  }, [localContent.attachments]);

  const save = async () => {
    if (!canonicalId || !user) return;
    try {
      setIsSaving(true);
      setHasConflict(false);

      if (!draft) {
        const created = await ExamReconService.upsertDraft(canonicalId, user.id, localContent);
        setDraft(created);
        lastRevisionRef.current = created.revision ?? 0;
        setIsDirty(false);
        toast.success('Gespeichert');
        return;
      }

      const prevRevision = draft.revision ?? 0;
      const res = await ExamReconService.updateDraftOptimistic({
        canonicalId,
        editorUserId: user.id,
        prevRevision,
        nextContent: localContent,
      });
      if (!res.ok) {
        setHasConflict(true);
        toast.error('Die Frage wurde von jemand anderem bearbeitet. Bitte neu laden.');
        return;
      }
      setDraft(res.draft);
      lastRevisionRef.current = res.draft.revision ?? 0;
      setIsDirty(false);
      toast.success('Gespeichert');
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message ?? 'Fehler beim Speichern');
    } finally {
      setIsSaving(false);
    }
  };

  const reload = async () => {
    if (!canonicalId) return;
    try {
      const d = await ExamReconService.getDraft(canonicalId);
      setDraft(d);
      setLocalContent((d?.content ?? {}) as ExamReconDraftContent);
      lastRevisionRef.current = d?.revision ?? 0;
      setHasConflict(false);
      setIsDirty(false);
      toast.success('Neu geladen');
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message ?? 'Fehler beim Neuladen');
    }
  };

  const onFileSelected: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    if (!workspaceId || !canonicalId) return;
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { storage_path } = await ExamReconService.uploadAttachment({ workspaceId, canonicalId, file });
      setLocalContent((c) => ({
        ...c,
        attachments: [...(c.attachments ?? []), { storage_path }],
      }));
      setIsDirty(true);
      toast.success('Bild hochgeladen');
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message ?? 'Bild konnte nicht hochgeladen werden');
    } finally {
      e.target.value = '';
    }
  };

  const removeAttachment = (storagePath: string) => {
    setLocalContent((c) => ({
      ...c,
      attachments: (c.attachments ?? []).filter((a) => a.storage_path !== storagePath),
    }));
    setIsDirty(true);
  };

  const markDone = async () => {
    if (!slotId) {
      toast.error('Kein Frageplatz-Kontext verfügbar.');
      return;
    }
    try {
      await ExamReconService.setTaskStatusBySlot(slotId, 'done');
      await ExamReconService.setSlotStatus(slotId, 'complete');
      toast.success('Als erledigt markiert');
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message ?? 'Konnte nicht abschließen');
    }
  };

  const relinkToCandidate = async (candidateId: string) => {
    if (!slotId) {
      toast.error('Kein Frageplatz-Kontext verfügbar.');
      return;
    }
    try {
      await ExamReconService.linkSlotToCanonical(slotId, candidateId);
      toast.success('Frageplatz verknüpft');
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message ?? 'Verknüpfung fehlgeschlagen');
    }
  };

  const mergeIntoCandidate = async (candidateId: string) => {
    if (!canonicalId) return;
    try {
      await ExamReconService.mergeCanonicals({ from: canonicalId, to: candidateId, reason: mergeReason.trim() || null });
      toast.success('Fragen zusammengeführt');
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message ?? 'Zusammenführen fehlgeschlagen');
    }
  };

  const splitOffThisSlot = async () => {
    if (!canonicalId || !slotId) {
      toast.error('Kein Frageplatz-Kontext verfügbar.');
      return;
    }
    try {
      const newId = await ExamReconService.createSplitCanonical({ from: canonicalId });
      await ExamReconService.splitMoveSlots({ from: canonicalId, to: newId, slotIds: [slotId], reason: 'split' });
      toast.success('Frage aufgeteilt und Frageplatz verschoben');
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message ?? 'Aufteilen fehlgeschlagen');
    }
  };

  const topLevelComments = useMemo(() => comments.filter((c) => !c.parent_id), [comments]);
  const repliesByParent = useMemo(() => {
    const m = new Map<string, any[]>();
    for (const c of comments) {
      if (!c.parent_id) continue;
      const arr = m.get(c.parent_id) ?? [];
      arr.push(c);
      m.set(c.parent_id, arr);
    }
    for (const arr of m.values()) arr.sort((a, b) => (a.created_at < b.created_at ? -1 : 1));
    return m;
  }, [comments]);

  const mcqKeys = useMemo(() => {
    const opt = localContent.options ?? [];
    const keys = opt.map((o) => o.key).filter(Boolean);
    return keys.length > 0 ? keys : ['A', 'B', 'C', 'D', 'E'];
  }, [localContent.options]);

  const voteSummary = useMemo(() => {
    const mcq: Record<string, number> = {};
    let totalMcq = 0;
    let totalFree = 0;
    const free: Record<string, number> = {};
    for (const v of votes) {
      if (v.vote_kind === 'mcq' && v.mcq_choice) {
        mcq[v.mcq_choice] = (mcq[v.mcq_choice] ?? 0) + 1;
        totalMcq += 1;
      }
      if (v.vote_kind === 'free_text' && v.free_text_answer) {
        const key = v.free_text_answer.trim();
        free[key] = (free[key] ?? 0) + 1;
        totalFree += 1;
      }
    }
    return { mcq, totalMcq, free, totalFree };
  }, [votes]);

  const myMcqVote = useMemo(() => votes.find((v) => v.vote_kind === 'mcq' && v.user_id === user?.id), [votes, user?.id]);
  const myFreeVote = useMemo(() => votes.find((v) => v.vote_kind === 'free_text' && v.user_id === user?.id), [votes, user?.id]);

  const submitComment = async () => {
    if (!canonicalId || !user) return;
    if (!newComment.trim()) return;
    try {
      await ExamReconService.addComment({
        canonical_question_id: canonicalId,
        user_id: user.id,
        content: newComment.trim(),
      });
      setNewComment('');
      const c = await ExamReconService.listComments(canonicalId);
      setComments(c as any[]);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message ?? 'Kommentar konnte nicht veröffentlicht werden');
    }
  };

  const submitReply = async () => {
    if (!canonicalId || !user || !replyTo) return;
    if (!replyText.trim()) return;
    try {
      await ExamReconService.addComment({
        canonical_question_id: canonicalId,
        user_id: user.id,
        content: replyText.trim(),
        parent_id: replyTo,
      });
      setReplyTo(null);
      setReplyText('');
      const c = await ExamReconService.listComments(canonicalId);
      setComments(c as any[]);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message ?? 'Antwort konnte nicht veröffentlicht werden');
    }
  };

  const castMcqVote = async (choice: string) => {
    if (!canonicalId || !user) return;
    try {
      await ExamReconService.upsertMcqVote({ canonical_question_id: canonicalId, user_id: user.id, mcq_choice: choice });
      const v = await ExamReconService.listVotes(canonicalId);
      setVotes(v as any[]);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message ?? 'Abstimmung konnte nicht gespeichert werden');
    }
  };

  const castFreeTextVote = async () => {
    if (!canonicalId || !user) return;
    if (!freeTextVote.trim()) return;
    try {
      await ExamReconService.upsertFreeTextVote({
        canonical_question_id: canonicalId,
        user_id: user.id,
        free_text_answer: freeTextVote.trim(),
      });
      setFreeTextVote('');
      const v = await ExamReconService.listVotes(canonicalId);
      setVotes(v as any[]);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message ?? 'Abstimmung konnte nicht gespeichert werden');
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-4">
      <ReconHeader
        title="Frage bearbeiten"
        subtitle={
          <div className="flex items-center gap-2 flex-wrap">
            <code className="text-xs bg-muted px-2 py-1 rounded">{canonicalId?.slice(0, 8)}…</code>
            {hasConflict && (
              <Badge variant="destructive">
                <AlertCircle className="h-3 w-3 mr-1" />
                Konflikt
              </Badge>
            )}
            <PresenceIndicator viewing={presenceCount.viewing} editing={presenceCount.editing} />
          </div>
        }
        actions={
          <>
            {hasConflict && (
              <Button variant="outline" onClick={reload}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Neu laden
              </Button>
            )}
            <Button onClick={save} disabled={!user || isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Speichere…
                </>
              ) : isDirty ? (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Speichern
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Gespeichert
                </>
              )}
            </Button>
            {slotId && (
              <Button variant="secondary" onClick={markDone}>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Als erledigt markieren
              </Button>
            )}
          </>
        }
      />

      {hasConflict && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Bearbeitungskonflikt</AlertTitle>
          <AlertDescription>
            Die Frage wurde von jemand anderem bearbeitet. Bitte lade die Seite neu, um die neueste Version zu sehen.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <span>Fragestellung</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            value={prompt}
            onChange={(e) => {
              setLocalContent((c) => ({ ...c, prompt: e.target.value }));
              setIsDirty(true);
            }}
            placeholder="Fragestellung eingeben (z. B. 'Was ist Photosynthese?')"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Lösung und Erklärung</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            value={explanation}
            onChange={(e) => {
              setLocalContent((c) => ({ ...c, solution_explanation: e.target.value }));
              setIsDirty(true);
            }}
            placeholder="Lösung und Erklärung eingeben"
            rows={8}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Image className="h-4 w-4" />
            Bilder und Anhänge
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Input
              type="file"
              accept="image/*"
              onChange={onFileSelected}
              className="cursor-pointer"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Unterstützte Formate: JPG, PNG, GIF
            </p>
          </div>
          <Separator />
          <div className="space-y-2">
            {(localContent.attachments ?? []).length === 0 && (
              <div className="text-sm text-muted-foreground">Noch keine Anhänge.</div>
            )}
            {(localContent.attachments ?? []).map((a) => (
              <div key={a.storage_path} className="flex items-center justify-between gap-3 p-2 border rounded-md">
                <div className="min-w-0 flex-1">
                  <div className="text-sm truncate">{a.storage_path.split('/').pop()}</div>
                  {attachmentUrls[a.storage_path] && (
                    <a
                      href={attachmentUrls[a.storage_path]}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-primary underline"
                    >
                      Öffnen
                    </a>
                  )}
                </div>
                <Button variant="outline" size="sm" onClick={() => removeAttachment(a.storage_path)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <GitMerge className="h-4 w-4" />
            Ähnliche Fragen
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm text-muted-foreground">
            Systemvorschläge basieren auf Text-Ähnlichkeit. Bitte immer manuell prüfen, ob es sich um dieselbe Frage handelt.
          </div>

          <div className="grid gap-2">
            <Label htmlFor="merge-reason">Begründung für Zusammenführung (optional)</Label>
            <Input
              id="merge-reason"
              value={mergeReason}
              onChange={(e) => setMergeReason(e.target.value)}
              placeholder="z. B. identischer Wortlaut, anderer Frageplatz"
            />
          </div>

          {similar.length === 0 && (
            <div className="text-sm text-muted-foreground">Keine ähnlichen Fragen gefunden.</div>
          )}

          <div className="space-y-2">
            {similar.map((s) => (
              <div key={s.candidate_id} className="rounded-md border p-3 space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm">
                    <span className="font-medium">Ähnlichkeit: {Math.round(s.similarity * 100)}%</span>{' '}
                    <span className="text-muted-foreground">({s.candidate_id.slice(0, 8)}…)</span>
                  </div>
                  <div className="flex gap-2">
                    {slotId && (
                      <Button variant="outline" size="sm" onClick={() => relinkToCandidate(s.candidate_id)}>
                        Mit dieser Frage verknüpfen
                      </Button>
                    )}
                    <Button variant="secondary" size="sm" onClick={() => mergeIntoCandidate(s.candidate_id)}>
                      Zusammenführen
                    </Button>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground line-clamp-3">
                  {s.normalized_prompt || '[keine Fragestellung]'}
                </div>
              </div>
            ))}
          </div>

          <Separator />
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm text-muted-foreground">
              Falls dieser Frageplatz doch eine andere Frage ist: neue Frage per Aufteilen erzeugen.
            </div>
            {slotId && (
              <Button variant="outline" onClick={splitOffThisSlot} disabled={!canonicalRow}>
                <GitBranch className="h-4 w-4 mr-2" />
                Aufteilen
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Vote className="h-4 w-4" />
            Abstimmung
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm text-muted-foreground">
            Stimme für eine Antwortoption oder gib deine eigene Lösung ein.
          </div>

          <div className="flex flex-wrap gap-2">
            {mcqKeys.map((k) => (
              <Button
                key={k}
                variant={myMcqVote?.mcq_choice === k ? 'default' : 'outline'}
                size="sm"
                onClick={() => castMcqVote(k)}
                disabled={!user}
              >
                {k} ({voteSummary.mcq[k] ?? 0})
              </Button>
            ))}
          </div>

          {voteSummary.totalMcq > 0 && (
            <div className="text-xs text-muted-foreground">
              Gesamt: {voteSummary.totalMcq} Abstimmung{voteSummary.totalMcq !== 1 ? 'en' : ''}
            </div>
          )}

          <Separator />

          <div className="grid gap-2">
            <Label htmlFor="free-text-vote">Eigene Lösungsvorschlag</Label>
            <div className="flex gap-2">
              <Input
                id="free-text-vote"
                value={freeTextVote}
                onChange={(e) => setFreeTextVote(e.target.value)}
                placeholder="Deine Antwort eingeben"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    castFreeTextVote();
                  }
                }}
              />
              <Button onClick={castFreeTextVote} disabled={!user || !freeTextVote.trim()}>
                Abstimmen
              </Button>
            </div>
            {myFreeVote?.free_text_answer && (
              <div className="text-xs text-muted-foreground">
                Deine Abstimmung: {myFreeVote.free_text_answer}
              </div>
            )}
            {Object.keys(voteSummary.free).length > 0 && (
              <div className="space-y-1 mt-2">
                <div className="text-xs text-muted-foreground font-medium">Top Vorschläge</div>
                {Object.entries(voteSummary.free)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 5)
                  .map(([ans, cnt]) => (
                    <div key={ans} className="text-sm">
                      <span className="font-medium">{cnt}×</span> {ans}
                    </div>
                  ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Diskussion
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Deine Frage oder Anmerkung..."
              rows={3}
            />
            <div className="flex justify-end">
              <Button onClick={submitComment} disabled={!user || !newComment.trim()}>
                Kommentar veröffentlichen
              </Button>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            {topLevelComments.length === 0 && (
              <div className="text-sm text-muted-foreground">Noch keine Kommentare.</div>
            )}
            {topLevelComments.map((c) => (
              <div key={c.id} className="rounded-md border p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-xs text-muted-foreground">
                    {c.user_id?.slice(0, 8)}… • {new Date(c.created_at).toLocaleString('de-DE')}
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setReplyTo(c.id)}>
                    Antworten
                  </Button>
                </div>
                <div className="text-sm whitespace-pre-wrap">{c.is_deleted ? '[gelöscht]' : c.content}</div>

                {replyTo === c.id && (
                  <div className="grid gap-2">
                    <Textarea value={replyText} onChange={(e) => setReplyText(e.target.value)} rows={2} placeholder="Antwort..." />
                    <div className="flex gap-2 justify-end">
                      <Button variant="outline" onClick={() => { setReplyTo(null); setReplyText(''); }}>
                        Abbrechen
                      </Button>
                      <Button onClick={submitReply} disabled={!replyText.trim()}>
                        Antworten
                      </Button>
                    </div>
                  </div>
                )}

                {(repliesByParent.get(c.id) ?? []).length > 0 && (
                  <div className="pl-3 border-l space-y-2">
                    {(repliesByParent.get(c.id) ?? []).map((r) => (
                      <div key={r.id} className="space-y-1">
                        <div className="text-xs text-muted-foreground">
                          {r.user_id?.slice(0, 8)}… • {new Date(r.created_at).toLocaleString('de-DE')}
                        </div>
                        <div className="text-sm whitespace-pre-wrap">{r.is_deleted ? '[gelöscht]' : r.content}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReconQuestion;
