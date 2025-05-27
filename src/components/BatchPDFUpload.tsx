
import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { showToast } from '@/utils/toast';
import { Question } from '@/types/Question';
import { FileUp, X, Upload, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";

interface BatchPDFFile {
  file: File;
  semester: string;
  year: string;
  isProcessing: boolean;
  isCompleted: boolean;
  error?: string;
}

interface BatchPDFUploadProps {
  onQuestionsLoaded: (questions: Question[]) => void;
  visibility: 'private' | 'university';
}

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

    const validFiles = files.filter(file => file.semester && file.year);
    if (validFiles.length === 0) {
      showToast.error('Fehler', {
        description: 'Bitte fülle Semester und Jahr für alle Dateien aus'
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
          formData.append('semester', fileData.semester);
          formData.append('year', fileData.year);

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

  const canUpload = files.length > 0 && files.every(file => file.semester && file.year) && !isUploading;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <FileUp className="h-5 w-5" />
          Batch PDF Upload
        </CardTitle>
        <CardDescription>
          Lade mehrere PDF-Dateien gleichzeitig hoch und weise jeweils Semester und Jahr zu.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* File Selection */}
        <div className="space-y-2">
          <Label>PDF-Dateien auswählen</Label>
          <div className="flex justify-center">
            <label htmlFor="batch-pdf-upload">
              <Button 
                variant="outline" 
                className="cursor-pointer"
                disabled={isUploading}
              >
                <FileUp className="h-4 w-4 mr-2" />
                PDFs auswählen
              </Button>
            </label>
            <input
              id="batch-pdf-upload"
              type="file"
              accept=".pdf"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              disabled={isUploading}
            />
          </div>
        </div>

        {/* Selected Files List */}
        {files.length > 0 && (
          <div className="space-y-4">
            <Label>Ausgewählte Dateien ({files.length})</Label>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {files.map((fileData, index) => (
                <Card key={index} className={`p-4 ${fileData.isCompleted ? 'bg-green-50' : fileData.error ? 'bg-red-50' : ''}`}>
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
                          onClick={() => removeFile(index)}
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

                    {/* Semester and Year Inputs */}
                    {!fileData.isCompleted && !fileData.error && (
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Semester</Label>
                          <Input
                            value={fileData.semester}
                            onChange={(e) => updateFileProperty(index, 'semester', e.target.value)}
                            placeholder="z.B. WS23/24"
                            className="h-8 text-xs"
                            disabled={fileData.isProcessing || isUploading}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Jahr</Label>
                          <Select
                            value={fileData.year}
                            onValueChange={(value) => updateFileProperty(index, 'year', value)}
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
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Upload Button */}
        {files.length > 0 && (
          <div className="flex justify-center pt-4">
            <Button
              onClick={handleBatchUpload}
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
        )}

        {files.length === 0 && (
          <div className="text-center text-muted-foreground py-8">
            Wähle PDF-Dateien aus, um zu beginnen
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BatchPDFUpload;
