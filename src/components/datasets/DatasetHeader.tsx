
import React from 'react';
import { Button } from '@/components/ui/button';
import { CardTitle } from '@/components/ui/card';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';
import { 
  Archive, 
  ArchiveRestore, 
  Play, 
  Calendar,
  HelpCircle
} from 'lucide-react';

interface QuestionSummary {
  id: string;
  filename: string;
  subject: string;
  difficulty: number;
  visibility: 'private' | 'university' | 'public';
  user_id: string | null;
  university_id: string | null;
  semester: string | null;
  year: string | null;
  exam_name: string | null;
  created_at: string;
}

interface DatasetHeaderProps {
  filename: string;
  questions: QuestionSummary[];
  onStartTraining: (questions: QuestionSummary[]) => void;
  createdAt: string;
  onArchive: (e: React.MouseEvent) => void;
  onRestore: (e: React.MouseEvent) => void;
  isArchived: boolean;
  displayName: string;
  onUnclearQuestions: () => void;
}

const DatasetHeader = ({
  filename,
  questions,
  onStartTraining,
  createdAt,
  onArchive,
  onRestore,
  isArchived,
  displayName,
  onUnclearQuestions
}: DatasetHeaderProps) => {
  const formattedDate = formatDistanceToNow(new Date(createdAt), {
    addSuffix: true,
    locale: de
  });

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="space-y-2">
        <CardTitle className="text-xl font-semibold text-slate-800 dark:text-zinc-50">
          {displayName}
        </CardTitle>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>Erstellt {formattedDate}</span>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-2">
        <Button
          onClick={() => onStartTraining(questions)}
          size="sm"
          className="flex items-center gap-2"
        >
          <Play className="h-4 w-4" />
          Training starten
        </Button>
        
        <Button
          onClick={onUnclearQuestions}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <HelpCircle className="h-4 w-4" />
          Unklare Fragen
        </Button>
        
        {isArchived ? (
          <Button
            onClick={onRestore}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <ArchiveRestore className="h-4 w-4" />
            Wiederherstellen
          </Button>
        ) : (
          <Button
            onClick={onArchive}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Archive className="h-4 w-4" />
            Archivieren
          </Button>
        )}
      </div>
    </div>
  );
};

export default DatasetHeader;
