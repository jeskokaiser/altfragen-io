import React, { useState } from 'react';
import { Question } from '@/types/Question';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Pencil } from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Anzahl der Fragen</TableHead>
                <TableHead>Hochgeladen am</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>{questions.length}</TableCell>
                <TableCell>
                  {new Date(questions[0].created_at!).toLocaleDateString()}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>

          {isSelected && (
            <div className="mt-4 space-y-4">
              <h3 className="font-semibold">Fragen:</h3>
              {questions.map((question, index) => (
                <div key={question.id} className="p-4 bg-slate-50 rounded-lg">
                  <p className="font-medium">Frage {index + 1}:</p>
                  <p className="mt-1">{question.question}</p>
                  <div className="mt-2 space-y-1">
                    <p>A: {question.optionA}</p>
                    <p>B: {question.optionB}</p>
                    <p>C: {question.optionC}</p>
                    <p>D: {question.optionD}</p>
                    {question.optionE && <p>E: {question.optionE}</p>}
                  </div>
                  <p className="mt-2 text-green-600">Richtige Antwort: {question.correctAnswer}</p>
                  {question.comment && (
                    <p className="mt-2 text-slate-600">Kommentar: {question.comment}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default DatasetCard;