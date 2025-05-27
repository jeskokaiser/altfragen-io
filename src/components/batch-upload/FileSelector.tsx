
import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from "@/components/ui/label";
import { FileUp } from 'lucide-react';

interface FileSelectorProps {
  onFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
  isUploading: boolean;
}

const FileSelector: React.FC<FileSelectorProps> = ({ onFileSelect, isUploading }) => {
  return (
    <div className="space-y-2">
      <Label>PDF-Dateien auswählen</Label>
      <div className="flex justify-center">
        <label htmlFor="batch-pdf-upload" className="cursor-pointer">
          <Button 
            variant="outline" 
            className="cursor-pointer"
            disabled={isUploading}
            asChild
          >
            <span>
              <FileUp className="h-4 w-4 mr-2" />
              PDFs auswählen
            </span>
          </Button>
        </label>
        <input
          id="batch-pdf-upload"
          type="file"
          accept=".pdf"
          multiple
          onChange={onFileSelect}
          className="hidden"
          disabled={isUploading}
        />
      </div>
    </div>
  );
};

export default FileSelector;
