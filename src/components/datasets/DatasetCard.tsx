import React from 'react';
import { Question } from '@/types/Question';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Pencil } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import DatasetStatistics from './DatasetStatistics';
import DatasetQuestionList from './DatasetQuestionList';

interface DatasetCardProps {
  filename: string;
  questions: Question[];
  isSelected: boolean;
  onDatasetClick: (filename: string) => void;
  onStartTraining: (questions: Question[]) => void;
  onRename: (oldFilename: string) => void;
  onSaveRename: (oldFilename: string, newFilename: string) => void;
  onCancelRename: () => void;
  isEditing: boolean;
  newFilename: string;
  onNewFilenameChange: (value: string) => void;
}

const DatasetCard: React.FC<DatasetCardProps> = ({
  filename,
  questions,
  isSelected,
  onDatasetClick,
  onStartTraining,
  onRename,
  onSaveRename,
  onCancelRename,
  isEditing,
  newFilename,
  onNewFilenameChange,
}) => {
  const { user } = useAuth();
  const questionIds = questions.map(q => q.id);

  const { data: progressData } = useQuery({
    queryKey: ['progress', filename],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', user?.id)
        .in('question_id', questionIds);

      if (error) throw error;
      return data;
    },
    enabled: !!user && questionIds.length > 0,
  });

  const getLatestAnswers = () => {
    if (!progressData) return new Map();
    
    const latestAnswers = new Map();
    progressData.forEach(progress => {
      const existing = latestAnswers.get(progress.question_id);
      if (!existing || new Date(progress.created_at) > new Date(existing.created_at)) {
        latestAnswers.set(progress.question_id, progress);
      }
    });
    return latestAnswers;
  };

  const latestAnswers = getLatestAnswers();
  const totalQuestions = questions.length;
  const answeredQuestions = latestAnswers.size;
  const correctAnswers = Array.from(latestAnswers.values()).filter(p => p.is_correct).length;
  const wrongAnswers = answeredQuestions - correctAnswers;

  return (
    <Card className={`${isSelected ? 'ring-2 ring-primary' : ''}`}>
      <CardHeader className="bg-slate-50">
        <div className="flex justify-between items-center">
          <div className="flex-1">
            {isEditing ? (
              <div className="flex items-center gap-2">
                <Input
                  value={newFilename}
                  onChange={(e) => onNewFilenameChange(e.target.value)}
                  className="max-w-md"
                  placeholder="Neuer Dateiname"
                />
                <Button 
                  onClick={() => onSaveRename(filename, newFilename)}
                  size="sm"
                >
                  Speichern
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={onCancelRename}
                >
                  Abbrechen
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg font-medium text-slate-800">
                  {filename} ({questions.length} Fragen)
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRename(filename)}
                  className="ml-2"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
          <Button onClick={() => onStartTraining(questions)}>
            Training starten
          </Button>
        </div>
        <p className="text-sm text-slate-600">
          Hochgeladen am {new Date(questions[0].created_at!).toLocaleDateString()}
        </p>
      </CardHeader>
      <CardContent>
        <div className="cursor-pointer" onClick={() => onDatasetClick(filename)}>
          <DatasetStatistics
            totalQuestions={totalQuestions}
            answeredQuestions={answeredQuestions}
            correctAnswers={correctAnswers}
            wrongAnswers={wrongAnswers}
          />
          <DatasetQuestionList
            questions={questions}
            isSelected={isSelected}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default DatasetCard;