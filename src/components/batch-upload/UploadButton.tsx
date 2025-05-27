
import React from 'react';
import { Button } from '@/components/ui/button';
import { Upload, Loader2 } from 'lucide-react';

interface UploadButtonProps {
  onUpload: () => void;
  canUpload: boolean;
  isUploading: boolean;
  fileCount: number;
}

const UploadButton: React.FC<UploadButtonProps> = ({
  onUpload,
  canUpload,
  isUploading,
  fileCount
}) => {
  if (fileCount === 0) return null;

  return (
    <div className="flex justify-center pt-4">
      <Button
        onClick={onUpload}
        disabled={!canUpload}
        className="flex items-center gap-2"
      >
        {isUploading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Verarbeite PDFs...
          </>
        ) : (
          <>
            <Upload className="h-4 w-4" />
            Alle PDFs verarbeiten
          </>
        )}
      </Button>
    </div>
  );
};

export default UploadButton;
