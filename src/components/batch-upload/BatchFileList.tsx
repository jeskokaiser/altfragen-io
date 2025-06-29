
import React from 'react';
import { Label } from "@/components/ui/label";
import { BatchPDFFile } from './types';
import BatchFileItem from './BatchFileItem';

interface BatchFileListProps {
  files: BatchPDFFile[];
  onUpdateFile: (index: number, property: keyof BatchPDFFile, value: any) => void;
  onRemoveFile: (index: number) => void;
  isUploading: boolean;
  years: string[];
}

const BatchFileList: React.FC<BatchFileListProps> = ({
  files,
  onUpdateFile,
  onRemoveFile,
  isUploading,
  years
}) => {
  if (files.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        Wähle Dateien aus, um zu beginnen
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Label>Ausgewählte Dateien ({files.length})</Label>
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {files.map((fileData, index) => (
          <BatchFileItem
            key={index}
            fileData={fileData}
            index={index}
            onUpdate={onUpdateFile}
            onRemove={onRemoveFile}
            isUploading={isUploading}
            years={years}
          />
        ))}
      </div>
    </div>
  );
};

export default BatchFileList;
