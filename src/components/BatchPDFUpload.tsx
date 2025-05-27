
import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { showToast } from '@/utils/toast';
import { Question } from '@/types/Question';
import { FileUp } from 'lucide-react';
import { BatchPDFFile, BatchPDFUploadProps } from './batch-upload/types';
import FileSelector from './batch-upload/FileSelector';
import BatchFileList from './batch-upload/BatchFileList';
import UploadButton from './batch-upload/UploadButton';

const BatchPDFUpload: React.FC<BatchPDFUploadProps> = ({ onQuestionsLoaded, visibility }) => {
  const { user } = useAuth();
  const [files, setFiles] = useState<BatchPDFFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // Generate years from 2010 to current year
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 2009 }, (_, i) => (currentYear - i).toString());

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (!selectedFiles) return;

    const newFiles: BatchPDFFile[] = Array.from(selectedFiles)
      .filter(file => file.type === 'application/pdf')
      .map(file => ({
        file,
        examName: '',
        semester: '',
        year: '',
        isProcessing: false,
        isCompleted: false
      }));

    setFiles(prev => [...prev, ...newFiles]);
    
    // Reset the input
    event.target.value = '';
  }, []);

  const updateFileProperty = (index: number, property: keyof BatchPDFFile, value: any) => {
    setFiles(prev => prev.map((file, i) => 
      i === index ? { ...file, [property]: value } : file
    ));
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleBatchUpload = async () => {
    if (!user?.id) {
      showToast.error('Fehler', {
        description: 'Benutzer nicht authentifiziert'
      });
      return;
    }

    const validFiles = files.filter(file => file.examName && file.semester && file.year);
    if (validFiles.length === 0) {
      showToast.error('Fehler', {
        description: 'Bitte fülle Prüfungsname, Semester und Jahr für alle Dateien aus'
      });
      return;
    }

    setIsUploading(true);

    try {
      let allQuestions: Question[] = [];

      for (let i = 0; i < validFiles.length; i++) {
        const fileData = validFiles[i];
        
        // Update processing status
        const fileIndex = files.findIndex(f => f.file === fileData.file);
        updateFileProperty(fileIndex, 'isProcessing', true);

        try {
          // Create FormData for the file upload
          const formData = new FormData();
          formData.append('file', fileData.file);
          formData.append('visibility', visibility);
          formData.append('examName', fileData.examName);
          formData.append('examYear', fileData.year);
          formData.append('examSemester', fileData.semester);

          // Upload PDF and process
          const { data, error } = await supabase.functions.invoke('process-pdf', {
            body: formData
          });

          if (error) {
            throw new Error(error.message || 'Fehler beim Verarbeiten der PDF');
          }

          if (data.success && data.questions) {
            allQuestions = [...allQuestions, ...data.questions];
            updateFileProperty(fileIndex, 'isCompleted', true);
            updateFileProperty(fileIndex, 'isProcessing', false);
            
            showToast.success(`${fileData.file.name} verarbeitet`, {
              description: `${data.questions.length} Fragen extrahiert`
            });
          } else {
            throw new Error(data.error || 'Unbekannter Fehler');
          }
        } catch (error: any) {
          console.error(`Error processing ${fileData.file.name}:`, error);
          updateFileProperty(fileIndex, 'error', error.message);
          updateFileProperty(fileIndex, 'isProcessing', false);
          
          showToast.error(`Fehler bei ${fileData.file.name}`, {
            description: error.message
          });
        }
      }

      if (allQuestions.length > 0) {
        onQuestionsLoaded(allQuestions);
        showToast.success('Batch-Upload abgeschlossen', {
          description: `Insgesamt ${allQuestions.length} Fragen aus ${validFiles.length} PDFs extrahiert`
        });
      }

    } finally {
      setIsUploading(false);
    }
  };

  const canUpload = files.length > 0 && files.every(file => file.examName && file.semester && file.year) && !isUploading;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <FileUp className="h-5 w-5" />
          Batch PDF Upload
        </CardTitle>
        <CardDescription>
          Lade mehrere PDF-Dateien gleichzeitig hoch und weise jeweils Prüfungsname, Semester und Jahr zu.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <FileSelector 
          onFileSelect={handleFileSelect}
          isUploading={isUploading}
        />

        <BatchFileList
          files={files}
          onUpdateFile={updateFileProperty}
          onRemoveFile={removeFile}
          isUploading={isUploading}
          years={years}
        />

        <UploadButton
          onUpload={handleBatchUpload}
          canUpload={canUpload}
          isUploading={isUploading}
          fileCount={files.length}
        />
      </CardContent>
    </Card>
  );
};

export default BatchPDFUpload;
