import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { FileUp, Lock, GraduationCap } from 'lucide-react';
import { BatchPDFFile, BatchPDFUploadProps } from './batch-upload/types';
import FileSelector from './batch-upload/FileSelector';
import BatchFileList from './batch-upload/BatchFileList';
import UploadButton from './batch-upload/UploadButton';
import BulkExamNameAssignment from './batch-upload/BulkExamNameAssignment';
import PDFQuestionReview from './PDFQuestionReview';

const BatchPDFUpload: React.FC<BatchPDFUploadProps> = ({ onQuestionsLoaded, visibility: initialVisibility }) => {
  const { user, universityId, universityName } = useAuth();
  const [files, setFiles] = useState<BatchPDFFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [visibility, setVisibility] = useState<'private' | 'university'>(initialVisibility);
  const [extractedQuestions, setExtractedQuestions] = useState<Question[] | null>(null);
  const [processingStats, setProcessingStats] = useState<any>(null);
  const [currentFilename, setCurrentFilename] = useState<string>('');

  // Generate years from 2010 to current year
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 2009 }, (_, i) => (currentYear - i).toString());

  // Function to extract semester and year from filename
  const extractSemesterAndYear = (filename: string) => {
    // Remove file extension
    const nameWithoutExt = filename.replace(/\.(pdf|docx)$/i, '');
    
    // Look for patterns like SS14, WS21, SS2014, WS2021
    const semesterYearMatch = nameWithoutExt.match(/(SS|WS)(\d{2,4})/i);
    
    if (semesterYearMatch) {
      const semester = semesterYearMatch[1].toUpperCase();
      let year = semesterYearMatch[2];
      
      // Convert 2-digit year to 4-digit year
      if (year.length === 2) {
        const twoDigitYear = parseInt(year);
        // Assume years 00-30 are 2000s, 31-99 are 1900s
        if (twoDigitYear <= 30) {
          year = `20${year}`;
        } else {
          year = `19${year}`;
        }
      }
      
      return { semester, year };
    }
    
    return { semester: '', year: '' };
  };

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (!selectedFiles) return;

    const newFiles: BatchPDFFile[] = Array.from(selectedFiles)
      .filter(file => {
        const isPDF = file.type === 'application/pdf';
        const isDOCX = file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        const isDocxByExtension = file.name.toLowerCase().endsWith('.docx');
        
        console.log('File:', file.name, 'Type:', file.type, 'isPDF:', isPDF, 'isDOCX:', isDOCX, 'isDocxByExtension:', isDocxByExtension);
        
        return isPDF || isDOCX || isDocxByExtension;
      })
      .map(file => {
        const { semester, year } = extractSemesterAndYear(file.name);
        
        return {
          file,
          examName: '',
          semester,
          year,
          isProcessing: false,
          isCompleted: false
        };
      });

    console.log('Filtered files:', newFiles.length, 'out of', selectedFiles.length);
    
    if (newFiles.length === 0) {
      showToast.error('Fehler', {
        description: 'Bitte wähle nur PDF- oder DOCX-Dateien aus'
      });
      return;
    }

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

  const handleApplyExamNameToAll = (examName: string) => {
    setFiles(prev => prev.map(file => ({ ...file, examName })));
    showToast.success('Prüfungsname angewendet', {
      description: `"${examName}" wurde für alle ${files.length} Dateien festgelegt`
    });
  };

  const fetchSavedQuestions = async (filename: string) => {
    try {
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('user_id', user?.id)
        .eq('filename', filename)
        .order('created_at', { ascending: true });

      if (error) throw error;

      return data.map(q => ({
        id: q.id,
        question: q.question,
        optionA: q.option_a,
        optionB: q.option_b,
        optionC: q.option_c,
        optionD: q.option_d,
        optionE: q.option_e,
        subject: q.subject,
        correctAnswer: q.correct_answer,
        comment: q.comment,
        filename: q.filename,
        difficulty: q.difficulty,
        is_unclear: q.is_unclear,
        marked_unclear_at: q.marked_unclear_at,
        university_id: q.university_id,
        visibility: (q.visibility as 'private' | 'university') || 'private',
        user_id: q.user_id,
        semester: q.exam_semester || null,
        year: q.exam_year || null,
        image_key: q.image_key || null,
        show_image_after_answer: q.show_image_after_answer || false,
        exam_name: q.exam_name || null
      }));
    } catch (error) {
      console.error('Error fetching saved questions:', error);
      return [];
    }
  };

  const checkTaskStatus = async (taskId: string) => {
    try {
      console.log(`Checking status for task: ${taskId}`);
      
      const { data, error } = await supabase.functions.invoke(`check-pdf-status?task_id=${taskId}`, {
        method: 'GET'
      });

      if (error) {
        console.error('Error from edge function:', error);
        throw new Error(error.message);
      }

      console.log('Status check response:', data);
      return data;
    } catch (error: any) {
      console.error('Error checking task status:', error);
      throw error;
    }
  };

  const pollTaskStatus = async (taskId: string, filename: string): Promise<Question[]> => {
    const maxAttempts = 30; // 5 minutes with 10-second intervals
    let attempts = 0;

    while (attempts < maxAttempts) {
      try {
        const data = await checkTaskStatus(taskId);

        if (data.status === 'completed') {
          if (data.success) {
            // Fetch the questions that were saved to the database by the API
            const savedQuestions = await fetchSavedQuestions(filename);
            
            if (savedQuestions.length > 0) {
              return savedQuestions;
            } else {
              throw new Error('Keine Fragen wurden aus der Datei extrahiert');
            }
          } else {
            const errorMessage = data.message || data.error || "Keine Fragen konnten aus der Datei extrahiert werden oder ein Problem ist aufgetreten.";
            throw new Error(errorMessage);
          }
        } else if (data.status === 'failed') {
          const failMessage = data.error || data.details || "Die Verarbeitung der Datei ist fehlgeschlagen";
          throw new Error(failMessage);
        }

        // Still processing, wait and try again
        await new Promise(resolve => setTimeout(resolve, 10000));
        attempts++;
      } catch (error) {
        console.error('Error polling task status:', error);
        throw error;
      }
    }

    throw new Error('Processing timeout - please try again');
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
          formData.append('userId', user.id);

          // Upload document and get task ID
          const { data: uploadData, error: uploadError } = await supabase.functions.invoke('process-pdf', {
            body: formData
          });

          if (uploadError) {
            throw new Error(uploadError.message || 'Fehler beim Verarbeiten der Datei');
          }

          if (!uploadData.success || !uploadData.task_id) {
            throw new Error(uploadData.error || 'Unbekannter Fehler beim Upload');
          }

          showToast.success(`${fileData.file.name} hochgeladen`, {
            description: 'Verarbeitung gestartet...'
          });

          // Poll for completion and fetch saved questions
          const questions = await pollTaskStatus(uploadData.task_id, fileData.file.name);
          
          if (questions && questions.length > 0) {
            allQuestions = [...allQuestions, ...questions];
            updateFileProperty(fileIndex, 'isCompleted', true);
            updateFileProperty(fileIndex, 'isProcessing', false);
            
            showToast.success(`${fileData.file.name} verarbeitet`, {
              description: `${questions.length} Fragen extrahiert`
            });
          } else {
            throw new Error('Keine Fragen aus der Datei extrahiert');
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
        // Show review interface instead of immediately calling onQuestionsLoaded
        setExtractedQuestions(allQuestions);
        setCurrentFilename(`${validFiles.length} Dateien`);
        setProcessingStats({
          exam_name: 'Batch Upload',
          images_uploaded: 0,
          total_questions: allQuestions.length,
          total_images: 0
        });
        
        showToast.success('Batch-Upload abgeschlossen', {
          description: `Insgesamt ${allQuestions.length} Fragen aus ${validFiles.length} Dateien extrahiert. Bitte überprüfe die Fragen.`
        });
      }

    } finally {
      setIsUploading(false);
    }
  };

  const handleReviewSave = async (reviewedQuestions: Question[]) => {
    try {
      // Show loading state for large batches
      if (reviewedQuestions.length > 50) {
        showToast.success("Verarbeitung gestartet", {
          description: `${reviewedQuestions.length} Fragen werden verarbeitet. Dies kann einige Minuten dauern.`
        });
      }

      // Update questions in the database with better error handling
      const updatePromises = reviewedQuestions.map(async (question, index) => {
        try {
          const { error } = await supabase
            .from('questions')
            .update({
              question: question.question,
              option_a: question.optionA,
              option_b: question.optionB,
              option_c: question.optionC,
              option_d: question.optionD,
              option_e: question.optionE,
              subject: question.subject,
              correct_answer: question.correctAnswer,
              comment: question.comment,
              difficulty: question.difficulty,
              visibility: question.visibility,
              university_id: question.visibility === 'university' ? universityId : null,
              exam_semester: question.semester,
              exam_year: question.year,
              exam_name: question.exam_name
            })
            .eq('id', question.id);

          if (error) {
            console.error(`Error updating question ${index + 1}:`, error);
            throw error;
          }
          
          return { success: true, question, index };
        } catch (error) {
          console.error(`Failed to update question ${index + 1}:`, error);
          return { success: false, question, index, error };
        }
      });

      // Process updates in batches to avoid overwhelming the database
      const batchSize = 20;
      const results = [];
      
      for (let i = 0; i < updatePromises.length; i += batchSize) {
        const batch = updatePromises.slice(i, i + batchSize);
        const batchResults = await Promise.allSettled(batch);
        results.push(...batchResults);
        
        // Show progress for large batches
        if (reviewedQuestions.length > 50 && i + batchSize < updatePromises.length) {
          const processed = i + batchSize;
          showToast.success(`Fortschritt: ${processed}/${reviewedQuestions.length} Fragen aktualisiert`);
        }
      }

      // Count successful and failed updates
      const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
      const failed = results.length - successful;

      if (failed > 0) {
        console.warn(`${failed} questions failed to update`);
        showToast.error(`${successful} Fragen aktualisiert, ${failed} Fehler`, {
          description: "Einige Fragen konnten nicht aktualisiert werden. Prüfe die Konsole für Details."
        });
      } else {
        showToast.success(`${successful} Fragen erfolgreich aktualisiert`, {
          description: "Alle Fragen wurden erfolgreich in der Datenbank aktualisiert"
        });
      }
      
      onQuestionsLoaded(reviewedQuestions);
      
      // Reset state
      setExtractedQuestions(null);
      setProcessingStats(null);
      setCurrentFilename('');
      setFiles([]);
      
    } catch (error: any) {
      console.error('Error updating questions:', error);
      showToast.error("Fehler beim Aktualisieren", {
        description: error.message || "Die Fragen konnten nicht aktualisiert werden"
      });
    }
  };

  const handleReviewCancel = () => {
    // Questions are already saved, just notify parent about them
    if (extractedQuestions) {
      onQuestionsLoaded(extractedQuestions);
    }
    // Reset state
    setExtractedQuestions(null);
    setProcessingStats(null);
    setCurrentFilename('');
    setFiles([]);
  };

  // If we have extracted questions, show the review interface
  if (extractedQuestions) {
    return (
      <div className="flex flex-col items-center gap-6 w-full max-w-4xl mx-auto">
        <PDFQuestionReview
          questions={extractedQuestions}
          visibility={visibility}
          onSave={handleReviewSave}
          onCancel={handleReviewCancel}
          filename={currentFilename}
          stats={processingStats}
          isEditMode={false}
        />
      </div>
    );
  }

  const canUpload = files.length > 0 && files.every(file => file.examName && file.semester && file.year) && !isUploading;

  const getUniversityContextMessage = () => {
    if (!universityId) {
      return "Du bist keiner Universität zugeordnet. Um Fragen mit deiner Universität zu teilen, aktualisiere dein Profil. Bitte beachte, dass private Fragen derzeit nur für Premium Nutzer mit KI-Kommentaren versehen werden und es auch hier ein Limit gibt.";
    }
    return `Du bist der Universität ${universityName || ''} zugeordnet und kannst Fragen mit anderen Studierenden teilen. Bitte beachte, dass private Fragen derzeit nur für Premium Nutzer mit KI-Kommentaren versehen werden und es auch hier ein Limit gibt.`;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <FileUp className="h-5 w-5" />
          Batch Dokument Upload
        </CardTitle>
        <CardDescription>
          Lade mehrere PDF- oder DOCX-Dateien gleichzeitig hoch und weise jeweils Prüfungsname, Semester und Jahr zu. Es ist erforderlich, dass die Dateien wie in <a href="https://www.altfragen.io/images/example-batch-upload.png" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">diesem Beispiel</a> formatiert sind. Für Fachschaften kann die Extraktion auf Anfrage an andere Schemata angepasst werden.
        </CardDescription>
        <div className="text-sm text-muted-foreground">
          {getUniversityContextMessage()}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>Sichtbarkeit der Fragen</Label>
          <Select 
            value={visibility} 
            onValueChange={(value: 'private' | 'university') => setVisibility(value)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Sichtbarkeit wählen" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="private">
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  <span>Privat (nur für dich)</span>
                </div>
              </SelectItem>
              <SelectItem value="university" disabled={!universityId}>
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4" />
                  <span>Universität (alle an deiner Uni)</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <FileSelector 
          onFileSelect={handleFileSelect}
          isUploading={isUploading}
        />

        {files.length > 0 && (
          <BulkExamNameAssignment
            onApplyToAll={handleApplyExamNameToAll}
            isDisabled={isUploading}
          />
        )}

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
