import React from 'react';
import { Badge } from '@/components/ui/badge';
import type { ExamReconVariantSlot } from '@/types/ExamRecon';

interface SlotCardProps {
  slot: ExamReconVariantSlot;
  variantCode: string;
  onClick: () => void;
}

const statusLabels: Record<string, string> = {
  unassigned: 'Nicht zugewiesen',
  assigned: 'Zugewiesen',
  in_progress: 'In Bearbeitung',
  in_review: 'In Prüfung',
  complete: 'Abgeschlossen',
  auto_linked: 'Automatisch verknüpft',
};

const statusVariants: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  unassigned: 'outline',
  assigned: 'secondary',
  in_progress: 'default',
  in_review: 'secondary',
  complete: 'default',
  auto_linked: 'secondary',
};

export const SlotCard: React.FC<SlotCardProps> = ({ slot, variantCode, onClick }) => {
  const statusLabel = statusLabels[slot.status] || slot.status;
  const statusVariant = statusVariants[slot.status] || 'outline';

  return (
    <button
      onClick={onClick}
      className="w-full text-left px-4 py-3 hover:bg-accent/40 transition-colors rounded-md border border-transparent hover:border-border"
      aria-label={`Frage ${variantCode} • Q${slot.slot_number} öffnen`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="font-medium">
          {variantCode} • Frage {slot.slot_number}
        </div>
        <Badge variant={statusVariant} className="text-xs">
          {statusLabel}
        </Badge>
      </div>
      {slot.canonical_question_id && (
        <div className="text-xs text-muted-foreground mt-1 truncate">
          Verknüpft
        </div>
      )}
    </button>
  );
};
