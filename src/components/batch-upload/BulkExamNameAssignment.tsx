
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Copy } from 'lucide-react';

interface BulkExamNameAssignmentProps {
  onApplyToAll: (examName: string) => void;
  isDisabled: boolean;
}

const BulkExamNameAssignment: React.FC<BulkExamNameAssignmentProps> = ({
  onApplyToAll,
  isDisabled
}) => {
  const [bulkExamName, setBulkExamName] = useState('');

  const handleApplyToAll = () => {
    if (bulkExamName.trim()) {
      onApplyToAll(bulkExamName.trim());
      setBulkExamName('');
    }
  };

  return (
    <Card className="bg-blue-50 border-blue-200">
      <CardContent className="p-4">
        <div className="space-y-3">
          <Label className="text-sm font-medium text-blue-900">
            Prüfungsname für alle Dateien festlegen
          </Label>
          <div className="flex gap-2">
            <Input
              value={bulkExamName}
              onChange={(e) => setBulkExamName(e.target.value)}
              placeholder="z.B. Anatomie Klausur"
              className="flex-1"
              disabled={isDisabled}
            />
            <Button
              onClick={handleApplyToAll}
              disabled={!bulkExamName.trim() || isDisabled}
              className="flex items-center gap-2"
              variant="outline"
            >
              <Copy className="h-4 w-4" />
              Auf alle anwenden
            </Button>
          </div>
          <p className="text-xs text-blue-700">
            Dieser Name wird für alle ausgewählten Dateien übernommen
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default BulkExamNameAssignment;
