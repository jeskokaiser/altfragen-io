import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { fetchQuestionsByExamName, updateQuestion } from '@/services/DatabaseService';
import { Question } from '@/types/Question';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import QuestionImage from '@/components/questions/QuestionImage';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

const QuestionEditorPanel: React.FC = () => {
  const [examNames, setExamNames] = useState<string[]>([]);
  const [selectedExamName, setSelectedExamName] = useState<string>('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [uploadingImage, setUploadingImage] = useState<boolean>(false);
  const [imageToRemove, setImageToRemove] = useState<boolean>(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [isNavigatingToPreviousPage, setIsNavigatingToPreviousPage] = useState<boolean>(false);

  const pageSize = 20;

  // Fetch exam names
  useEffect(() => {
    const fetchExamNames = async () => {
      const { data, error } = await supabase
        .from('questions')
        .select('exam_name')
        .not('exam_name', 'is', null);

      if (error) {
        console.error('Error fetching exam names:', error);
        return;
      }

      const uniqueExamNames = Array.from(
        new Set(data.map((q: any) => q.exam_name).filter((name: string | null) => name))
      ).sort() as string[];

      setExamNames(uniqueExamNames);
    };

    fetchExamNames();
  }, []);

  // Reset to first page when exam name changes
  useEffect(() => {
    if (selectedExamName) {
      setCurrentPage(0);
    }
  }, [selectedExamName]);

  // Fetch questions when filters change
  useEffect(() => {
    if (selectedExamName) {
      loadQuestions();
    } else {
      setQuestions([]);
      setTotalCount(0);
      setCurrentQuestionIndex(0);
      setEditingQuestion(null);
    }
  }, [selectedExamName, currentPage]);

  // Update editing question when questions array or index changes
  useEffect(() => {
    if (questions.length > 0 && currentQuestionIndex >= 0 && currentQuestionIndex < questions.length) {
      // Create a new object reference to ensure React detects the change
      const currentQuestion = questions[currentQuestionIndex];
      setEditingQuestion({
        ...currentQuestion,
        optionA: currentQuestion.optionA || '',
        optionB: currentQuestion.optionB || '',
        optionC: currentQuestion.optionC || '',
        optionD: currentQuestion.optionD || '',
        optionE: currentQuestion.optionE || '',
        correctAnswer: currentQuestion.correctAnswer || ''
      });
      setHasUnsavedChanges(false);
    } else if (questions.length === 0) {
      setEditingQuestion(null);
    }
  }, [questions, currentQuestionIndex]);

  const loadQuestions = async () => {
    if (!selectedExamName) return;

    setLoading(true);
    try {
      const result = await fetchQuestionsByExamName(selectedExamName, currentPage, pageSize);
      setQuestions(result.questions);
      setTotalCount(result.totalCount);
      
      // Set index based on navigation direction
      if (result.questions.length > 0) {
        if (isNavigatingToPreviousPage) {
          // Start at last question when going to previous page
          setCurrentQuestionIndex(result.questions.length - 1);
          setIsNavigatingToPreviousPage(false);
        } else {
          // Start at first question when going to next page or initial load
          setCurrentQuestionIndex(0);
        }
      } else {
        setCurrentQuestionIndex(0);
        setIsNavigatingToPreviousPage(false);
      }
    } catch (error: any) {
      console.error('Error loading questions:', error);
      toast.error('Fehler beim Laden der Fragen');
    } finally {
      setLoading(false);
    }
  };

  const handlePrevious = () => {
    const navigate = async () => {
      if (hasUnsavedChanges) {
        await saveCurrentQuestion();
      }

      if (currentQuestionIndex > 0) {
        setCurrentQuestionIndex(currentQuestionIndex - 1);
      } else if (currentPage > 0) {
        // Load previous page - mark that we're navigating to previous page
        setIsNavigatingToPreviousPage(true);
        setCurrentPage(currentPage - 1);
      }
    };

    void navigate();
  };

  const handleNext = () => {
    const navigate = async () => {
      if (hasUnsavedChanges) {
        await saveCurrentQuestion();
      }

      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      } else {
        // Load next page if available - will reset index to 0
        const totalPages = Math.ceil(totalCount / pageSize);
        if (currentPage < totalPages - 1) {
          setCurrentPage(currentPage + 1);
        }
      }
    };

    void navigate();
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !editingQuestion) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Bitte wähle eine Bilddatei aus');
      return;
    }

    setUploadingImage(true);
    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${editingQuestion.id}_${Date.now()}.${fileExt}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('exam-images')
        .upload(fileName, file, {
          contentType: file.type,
          upsert: true
        });

      if (uploadError) {
        throw uploadError;
      }

      // Delete old image if exists
      if (editingQuestion.image_key) {
        await supabase.storage
          .from('exam-images')
          .remove([editingQuestion.image_key]);
      }

      // Update question with new image_key
      const updatedQuestion = await updateQuestion(editingQuestion.id, {
        image_key: fileName
      });

      setEditingQuestion(updatedQuestion);
      toast.success('Bild erfolgreich hochgeladen');
    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast.error('Fehler beim Hochladen des Bildes');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemoveImage = async () => {
    if (!editingQuestion?.image_key) return;

    try {
      // Delete from storage
      await supabase.storage
        .from('exam-images')
        .remove([editingQuestion.image_key]);

      // Update question
      const updatedQuestion = await updateQuestion(editingQuestion.id, {
        image_key: null
      });

      setEditingQuestion(updatedQuestion);
      setImageToRemove(false);
      toast.success('Bild erfolgreich entfernt');
    } catch (error: any) {
      console.error('Error removing image:', error);
      toast.error('Fehler beim Entfernen des Bildes');
    }
  };

  const saveCurrentQuestion = async () => {
    if (!editingQuestion) return;

    try {
      const questionCase = editingQuestion.question_case;
      const trimmedQuestionCase = typeof questionCase === 'string' && questionCase.trim() 
        ? questionCase.trim() 
        : null;

      const updates: Partial<Question> = {
        correctAnswer: editingQuestion.correctAnswer,
        question_case: trimmedQuestionCase,
      };

      const updatedQuestion = await updateQuestion(editingQuestion.id, updates);
      toast.success('Frage erfolgreich aktualisiert');
      setHasUnsavedChanges(false);
      
      // Update the question in the current list
      const updatedQuestions = [...questions];
      updatedQuestions[currentQuestionIndex] = updatedQuestion;
      setQuestions(updatedQuestions);
      setEditingQuestion(updatedQuestion);
    } catch (error: any) {
      console.error('Error updating question:', error);
      toast.error('Fehler beim Aktualisieren der Frage');
    }
  };

  const totalPages = Math.ceil(totalCount / pageSize);
  const globalQuestionIndex = currentPage * pageSize + currentQuestionIndex + 1;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Fragen bearbeiten</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="examName">Exam Name</Label>
              <Select value={selectedExamName} onValueChange={setSelectedExamName}>
                <SelectTrigger>
                  <SelectValue placeholder="Exam Name auswählen" />
                </SelectTrigger>
                <SelectContent>
                  {examNames.map((name) => (
                    <SelectItem key={name} value={name}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button 
                onClick={() => {
                  setCurrentPage(0);
                  loadQuestions();
                }}
                disabled={!selectedExamName || loading}
              >
                Laden
              </Button>
            </div>
          </div>
          
          <div className="text-xs text-muted-foreground">
            Sortierung: question_case ASC, dann question_exam_number ASC
          </div>

          {selectedExamName && (
            <div className="text-sm text-muted-foreground">
              {totalCount} Fragen gefunden
            </div>
          )}
        </CardContent>
      </Card>

      {loading && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </CardContent>
        </Card>
      )}

      {!loading && editingQuestion && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                Frage {globalQuestionIndex} von {totalCount}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={currentQuestionIndex === 0 && currentPage === 0}
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Vorherige
                </Button>
                <Button
                  variant="outline"
                  onClick={handleNext}
                  disabled={currentQuestionIndex === questions.length - 1 && currentPage >= totalPages - 1}
                >
                  Nächste
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                await saveCurrentQuestion();
              }}
              className="space-y-6"
            >
              {/* Question Text */}
              <div className="space-y-2">
                <Label>Frage</Label>
                <div className="p-4 bg-muted rounded-lg">
                  {editingQuestion.question}
                </div>
              </div>

              {/* Answer Options - Compact, Read Only */}
              <div className="space-y-4">
                <h3 className="font-semibold">Antwortoptionen</h3>
                <div className="grid gap-2 text-sm">
                  <div className="flex gap-2">
                    <span className="font-semibold w-6">A)</span>
                    <span className="flex-1">{editingQuestion.optionA}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="font-semibold w-6">B)</span>
                    <span className="flex-1">{editingQuestion.optionB}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="font-semibold w-6">C)</span>
                    <span className="flex-1">{editingQuestion.optionC}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="font-semibold w-6">D)</span>
                    <span className="flex-1">{editingQuestion.optionD}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="font-semibold w-6">E)</span>
                    <span className="flex-1">{editingQuestion.optionE}</span>
                  </div>
                  <div className="flex gap-2 items-center pt-2 text-sm">
                    <span className="font-semibold">Richtig:</span>
                    <div className="flex gap-1">
                      {['A', 'B', 'C', 'D', 'E'].map((letter) => {
                        const isSelected = editingQuestion.correctAnswer === letter;
                        return (
                          <Button
                            key={letter}
                            type="button"
                            size="sm"
                            variant={isSelected ? 'default' : 'outline'}
                            className="h-7 px-2 text-xs"
                            onClick={() => {
                              setEditingQuestion(prev =>
                                prev ? { ...prev, correctAnswer: letter } : prev
                              );
                              setHasUnsavedChanges(true);
                            }}
                          >
                            {letter}
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Question Case - Simple Text Field */}
              <div className="space-y-2">
                <Label htmlFor="questionCase">Question Case</Label>
                <Input
                  id="questionCase"
                  name="questionCase"
                  value={editingQuestion.question_case || ''}
                  placeholder="z.B. M2-F25_1_1"
                  onChange={(e) => {
                    setEditingQuestion(prev =>
                      prev ? { ...prev, question_case: e.target.value } : prev
                    );
                    setHasUnsavedChanges(true);
                  }}
                />
              </div>

              {/* Case Text - Read Only */}
              <div className="space-y-2">
                <Label>Case Text</Label>
                <div className="p-4 bg-muted rounded-lg whitespace-pre-line text-sm">
                  {editingQuestion.case_text || '—'}
                </div>
              </div>

              {/* Image Upload */}
              <div className="space-y-4">
                <h3 className="font-semibold">Bild</h3>
                
                {editingQuestion.image_key && !imageToRemove && (
                  <div className="space-y-2">
                    <Label>Aktuelles Bild</Label>
                    <QuestionImage imageKey={editingQuestion.image_key} />
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button type="button" variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Bild entfernen
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Bild entfernen</AlertDialogTitle>
                          <AlertDialogDescription>
                            Bist du sicher, dass du das Bild entfernen möchtest?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                          <AlertDialogAction onClick={handleRemoveImage}>
                            Entfernen
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="imageUpload">Neues Bild hochladen</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="imageUpload"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploadingImage}
                    />
                    {uploadingImage && (
                      <span className="text-sm text-muted-foreground">Upload läuft...</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t">
                <div>
                  {hasUnsavedChanges && (
                    <span className="text-sm text-amber-600">Ungespeicherte Änderungen</span>
                  )}
                </div>
                <Button type="submit" disabled={!hasUnsavedChanges}>
                  Speichern
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {!loading && selectedExamName && questions.length === 0 && (
        <Alert>
          <AlertDescription>
            Keine Fragen für dieses Exam gefunden.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default QuestionEditorPanel;

