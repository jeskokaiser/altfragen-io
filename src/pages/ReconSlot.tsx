import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Loader2, AlertCircle, FileQuestion } from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';
import { ExamReconService } from '@/services/ExamReconService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { ReconHeader } from '@/components/recon/ReconHeader';
import { ReconEmptyState } from '@/components/recon/ReconEmptyState';

const ReconSlot: React.FC = () => {
  const { workspaceId, slotId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [canonicalId, setCanonicalId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slotId) return;
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const slot = await ExamReconService.getSlot(slotId);
        if (!alive) return;
        if (slot.canonical_question_id) {
          setCanonicalId(slot.canonical_question_id);
        } else {
          setCanonicalId(null);
        }
      } catch (e: any) {
        console.error(e);
        setError(e?.message ?? 'Fehler beim Laden');
        toast.error(e?.message ?? 'Fehler beim Laden');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [slotId]);

  useEffect(() => {
    if (workspaceId && canonicalId) {
      navigate(`/recon/${workspaceId}/q/${canonicalId}?slot=${slotId}`, { replace: true });
    }
  }, [workspaceId, canonicalId, navigate, slotId]);

  const handleStart = async () => {
    if (!workspaceId || !slotId || !user) return;
    try {
      const canonical = await ExamReconService.createCanonicalQuestion({
        workspace_id: workspaceId,
        created_by: user.id,
        question_type: 'unknown',
      });
      await ExamReconService.linkSlotToCanonical(slotId, canonical.id);
      await ExamReconService.upsertDraft(canonical.id, user.id, { prompt: '' });
      toast.success('Frage erstellt');
      navigate(`/recon/${workspaceId}/q/${canonical.id}?slot=${slotId}`, { replace: true });
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message ?? 'Fehler beim Erstellen der Frage');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="space-y-2 mb-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <ReconHeader title="Frageplatz" />
        <Alert variant="destructive" className="mt-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Fehler beim Laden</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <ReconHeader title="Frageplatz" subtitle="Erfasse die Frage für diesen Platz" />
      <div className="mt-6">
        {canonicalId ? (
          <Card>
            <CardContent className="py-8 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Weiterleitung zur Frage...</p>
            </CardContent>
          </Card>
        ) : (
          <ReconEmptyState
            title="Noch keine Frage verlinkt"
            description="Für diesen Frageplatz wurde noch keine Frage erfasst. Starte die Rekonstruktion, um die Frage zu erfassen und zu bearbeiten."
            actionLabel="Frage erfassen"
            onAction={handleStart}
            icon={<FileQuestion className="h-12 w-12" />}
          />
        )}
      </div>
    </div>
  );
};

export default ReconSlot;
