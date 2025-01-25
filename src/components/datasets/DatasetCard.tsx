import React from 'react';
import { Question } from '@/types/Question';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, Play } from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import DatasetStatistics from './DatasetStatistics';

interface DatasetCardProps {
  filename: string;
  questions: Question[];
  isSelected: boolean;
  onDatasetClick: (filename: string) => void;
  onStartTraining: (questions: Question[]) => void;
}

const DatasetCard: React.FC<DatasetCardProps> = ({
  filename,
  questions,
  isSelected,
  onDatasetClick,
  onStartTraining,
}) => {
  return (
    <Card className={`transition-all duration-200 ${isSelected ? 'ring-2 ring-primary' : 'hover:shadow-md'}`}>
      <CardHeader className="bg-slate-50/50">
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1 space-y-2">
            <CardTitle className="text-lg font-medium text-slate-800">
              {filename}
            </CardTitle>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>{questions.length} Fragen</span>
              <span>•</span>
              <span>Hochgeladen am {new Date(questions[0].created_at!).toLocaleDateString()}</span>
            </div>
          </div>
          <Button 
            onClick={() => onStartTraining(questions)}
            className="shrink-0"
          >
            <Play className="mr-2 h-4 w-4" />
            Training starten
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        <DatasetStatistics questions={questions} />
      </CardContent>

      <Separator />

      <CardFooter className="p-4">
        <Button
          variant="outline"
          onClick={() => onDatasetClick(filename)}
          className="w-full"
        >
          {isSelected ? (
            <>
              <ChevronUp className="mr-2 h-4 w-4" />
              Fragen ausblenden
            </>
          ) : (
            <>
              <ChevronDown className="mr-2 h-4 w-4" />
              Fragen anzeigen
            </>
          )}
        </Button>
      </CardFooter>

      {isSelected && (
        <>
          <Separator />
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-4">Fragen:</h3>
            <div className="space-y-4">
              {questions.map((question, index) => (
                <div key={question.id} className="p-4 bg-slate-50 rounded-lg space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-muted-foreground">Frage {index + 1}</span>
                  </div>
                  <p className="font-medium">{question.question}</p>
                  <div className="space-y-2 pl-4">
                    <p className="text-sm">A: {question.optionA}</p>
                    <p className="text-sm">B: {question.optionB}</p>
                    <p className="text-sm">C: {question.optionC}</p>
                    <p className="text-sm">D: {question.optionD}</p>
                    {question.optionE && <p className="text-sm">E: {question.optionE}</p>}
                  </div>
                  <div className="pt-2 border-t">
                    <p className="text-sm text-green-600">Richtige Antwort: {question.correctAnswer}</p>
                    {question.comment && (
                      <p className="text-sm text-slate-600 mt-2">Kommentar: {question.comment}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </>
      )}
    </Card>
  );
};

export default DatasetCard;