
import React from 'react';
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FileUp, X, Loader2 } from 'lucide-react';
import { BatchPDFFile } from './types';

interface BatchFileItemProps {
  fileData: BatchPDFFile;
  index: number;
  onUpdate: (index: number, property: keyof BatchPDFFile, value: any) => void;
  onRemove: (index: number) => void;
  isUploading: boolean;
  years: string[];
}

const BatchFileItem: React.FC<BatchFileItemProps> = ({
  fileData,
  index,
  onUpdate,
  onRemove,
  isUploading,
  years
}) => {
  return (
    <Card className={`p-4 ${fileData.isCompleted ? 'bg-green-50' : fileData.error ? 'bg-red-50' : ''}`}>
      <div className="space-y-3">
        {/* File Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileUp className="h-4 w-4" />
            <span className="font-medium text-sm truncate max-w-48">
              {fileData.file.name}
            </span>
            {fileData.isProcessing && (
              <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
            )}
            {fileData.isCompleted && (
              <span className="text-green-600 text-xs">✓ Abgeschlossen</span>
            )}
          </div>
          {!fileData.isProcessing && !isUploading && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRemove(index)}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Error Display */}
        {fileData.error && (
          <Alert variant="destructive">
            <AlertDescription className="text-xs">
              {fileData.error}
            </AlertDescription>
          </Alert>
        )}

        {/* Exam Name, Semester and Year Inputs */}
        {!fileData.isCompleted && !fileData.error && (
          <div className="space-y-3">
            {/* Exam Name */}
            <div className="space-y-1">
              <Label className="text-xs">Prüfungsname</Label>
              <Input
                value={fileData.examName}
                onChange={(e) => onUpdate(index, 'examName', e.target.value)}
                placeholder="z.B. Anatomie Klausur"
                className="h-8 text-xs"
                disabled={fileData.isProcessing || isUploading}
              />
            </div>
            
            {/* Semester and Year */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Semester</Label>
                <RadioGroup
                  value={fileData.semester}
                  onValueChange={(value) => onUpdate(index, 'semester', value)}
                  disabled={fileData.isProcessing || isUploading}
                  className="flex flex-col space-y-1"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="WS" id={`ws-${index}`} />
                    <Label htmlFor={`ws-${index}`} className="text-xs cursor-pointer">
                      WS
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="SS" id={`ss-${index}`} />
                    <Label htmlFor={`ss-${index}`} className="text-xs cursor-pointer">
                      SS
                    </Label>
                  </div>
                </RadioGroup>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Jahr</Label>
                <Select
                  value={fileData.year}
                  onValueChange={(value) => onUpdate(index, 'year', value)}
                  disabled={fileData.isProcessing || isUploading}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Jahr wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((year) => (
                      <SelectItem key={year} value={year}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default BatchFileItem;
