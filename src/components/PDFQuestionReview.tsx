import React, { useState, useEffect } from 'react';
import { Question } from '@/types/Question';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Check, X, AlertCircle, Save, ArrowLeft, ArrowRight, Image as ImageIcon, Trash2, Move, Loader2, Sparkles, LoaderCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from '@/components/ui/badge';
import QuestionImage from './questions/QuestionImage';
import ImageAssignment from './questions/ImageAssignment';
import { supabase } from '@/integrations/supabase/client';
import { showToast } from '@/utils/toast';
import { useAuth } from '@/contexts/AuthContext';

interface PDFQuestionReviewProps {
  questions: Question[];
  visibility: 'private' | 'university';
  onSave: (questions: Question[]) => void;
  onCancel: () => void;
  filename: string;
  stats?: {
    exam_name: string;
    images_uploaded: number;
    total_questions: number;
    total_images: number;
  } | null;
  isEditMode?: boolean;
}

const PDFQuestionReview: React.FC<PDFQuestionReviewProps> = ({ 
  questions: initialQuestions, 
  visibility, 
  onSave, 
  onCancel,
  filename,
  stats,
  isEditMode = false
}) => {
  const { user } = useAuth();
  const [questions, setQuestions] = useState<Question[]>(initialQuestions);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [activeTab, setActiveTab] = useState('review');
  const [selectedTargetQuestion, setSelectedTargetQuestion] = useState<number | null>(null);
  const [subjectList, setSubjectList] = useState('');
  const [isAssigningSubjects, setIsAssigningSubjects] = useState(false);
  const [assignmentProgress, setAssignmentProgress] = useState<{
    processed: number;
    total: number;
    currentChunk: number;
    totalChunks: number;
  } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const currentQuestion = questions[currentIndex];

  // Add keyboard navigation effect
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle arrow keys when on the review tab
      if (activeTab !== 'review') return;
      
      // Don't handle if user is typing in an input/textarea
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
      
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        handlePrevious();
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        handleNext();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeTab, currentIndex, questions.length]);
  
  const updateQuestion = (index: number, updates: Partial<Question>) => {
    const updatedQuestions = [...questions];
    updatedQuestions[index] = { ...updatedQuestions[index], ...updates };
    setQuestions(updatedQuestions);
  };
  
  const handleImageReassign = (fromQuestionIndex: number, toQuestionIndex: number) => {
    const updatedQuestions = [...questions];
    const imageKey = updatedQuestions[fromQuestionIndex].image_key;
    
    // Remove image from source question
    updatedQuestions[fromQuestionIndex] = { 
      ...updatedQuestions[fromQuestionIndex], 
      image_key: null 
    };
    
    // Add image to target question
    updatedQuestions[toQuestionIndex] = { 
      ...updatedQuestions[toQuestionIndex], 
      image_key: imageKey 
    };
    
    setQuestions(updatedQuestions);
    setSelectedTargetQuestion(null);
  };
  
  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };
  
  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };
  
  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      // Add a small delay to show the loading state
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Save all questions without validation
      onSave(questions.map(q => ({
        ...q,
        visibility
      })));
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleRemoveQuestion = (index: number) => {
    if (questions.length <= 1) {
      return; // Don't remove the last question
    }
    
    const newQuestions = [...questions];
    newQuestions.splice(index, 1);
    
    // Adjust current index if necessary
    let newIndex = currentIndex;
    if (currentIndex >= newQuestions.length) {
      newIndex = newQuestions.length - 1;
    }
    
    setQuestions(newQuestions);
    setCurrentIndex(newIndex);
  };

  const handleRemoveImage = () => {
    updateQuestion(currentIndex, { image_key: null });
  };

  const handleMoveImage = () => {
    if (selectedTargetQuestion !== null) {
      handleImageReassign(currentIndex, selectedTargetQuestion);
    }
  };
  
  const handleLLMSubjectAssignment = async () => {
    if (!subjectList.trim()) {
      showToast.error('Fehler', {
        description: 'Bitte gib eine Liste von Fächern ein'
      });
      return;
    }

    if (!user?.id) {
      showToast.error('Fehler', {
        description: 'Benutzer nicht authentifiziert'
      });
      return;
    }

    const availableSubjects = subjectList
      .split(',')
      .map(subject => subject.trim())
      .filter(subject => subject.length > 0);

    if (availableSubjects.length === 0) {
      showToast.error('Fehler', {
        description: 'Keine gültigen Fächer gefunden'
      });
      return;
    }

    setIsAssigningSubjects(true);
    setAssignmentProgress({
      processed: 0,
      total: questions.length,
      currentChunk: 0,
      totalChunks: Math.ceil(questions.length / 20) // Estimated chunks
    });
    
    // Show initial progress toast
    showToast.info('KI-Fach-Zuweisung gestartet', {
      description: `Verarbeitung von ${questions.length} Fragen wird gestartet...`
    });
    
    try {
      const { data, error } = await supabase.functions.invoke('assign-subjects', {
        body: {
          questions: questions,
          availableSubjects: availableSubjects,
          userId: user.id
        }
      });

      if (error) {
        throw error;
      }

      if (data.success && data.updatedQuestions) {
        // Update the questions state with the AI-assigned subjects
        setQuestions(data.updatedQuestions);
        
        // Show detailed completion stats
        const stats = data.stats || {};
        const successRate = stats.successful ? Math.round((stats.successful / stats.total) * 100) : 100;
        
        showToast.success('Fächer erfolgreich zugewiesen', {
          description: `${stats.successful || data.updatedQuestions.length} von ${stats.total || questions.length} Fragen (${successRate}%) erfolgreich verarbeitet${stats.errors > 0 ? `. ${stats.errors} Fragen verwendeten Fallback-Fächer.` : ''}`,
          duration: 6000
        });
        
        // Show progress completion
        setAssignmentProgress({
          processed: stats.total || questions.length,
          total: stats.total || questions.length,
          currentChunk: stats.totalChunks || 1,
          totalChunks: stats.totalChunks || 1
        });
        
        // Clear progress after a short delay
        setTimeout(() => {
          setAssignmentProgress(null);
        }, 2000);
      } else {
        throw new Error(data.error || 'Unbekannter Fehler');
      }
    } catch (error: any) {
      console.error('Error assigning subjects:', error);
      showToast.error('Fehler beim Zuweisen der Fächer', {
        description: error.message || 'Bitte versuche es später erneut',
        duration: 6000
      });
      setAssignmentProgress(null);
    } finally {
      setIsAssigningSubjects(false);
    }
  };
  
  return (
    <div className="w-full">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>{isEditMode ? 'Bearbeite extrahierte Fragen' : 'Überprüfe extrahierte Fragen'}</span>
            {activeTab === 'review' && (
              <span className="text-sm font-normal text-muted-foreground">
                {currentIndex + 1} von {questions.length}
              </span>
            )}
          </CardTitle>
          <CardDescription>
            <div className="space-y-2">
              <p>
                {isEditMode 
                  ? `Die PDF-Datei "${filename}" wurde verarbeitet und die Fragen wurden gespeichert. Du kannst sie hier bearbeiten.`
                  : `Die PDF-Datei "${filename}" wurde verarbeitet. Bitte überprüfe die extrahierten Fragen und korrigiere sie bei Bedarf.`
                }
              </p>
              <p className="text-xs text-muted-foreground">
                💡 Tipp: Verwende die Pfeiltasten ← → um zwischen den Fragen zu navigieren
              </p>
              
              {stats && (
                <div className="flex flex-wrap gap-2 mt-2">
                  <Badge variant="outline" className="bg-muted/50">
                    {stats.total_questions} Fragen extrahiert
                  </Badge>
                  {stats.images_uploaded > 0 && (
                    <Badge variant="outline" className="bg-muted/50">
                      {stats.images_uploaded} Bilder extrahiert
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="review">Fragen überprüfen</TabsTrigger>
              <TabsTrigger value="images">Bilder zuordnen</TabsTrigger>
            </TabsList>
            
            <TabsContent value="review" className="space-y-6 mt-6">
              <div className="space-y-6">
                <div>
                  <Label htmlFor="question">Frage</Label>
                  <Textarea
                    id="question"
                    value={currentQuestion.question}
                    onChange={(e) => updateQuestion(currentIndex, { question: e.target.value })}
                    rows={3}
                    className="mt-1"
                  />
                </div>

                {currentQuestion.image_key && (
                  <div className="relative">
                    <div className="flex justify-between items-center mb-2">
                      <Label>Bild</Label>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-destructive" 
                        onClick={handleRemoveImage}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Bild entfernen
                      </Button>
                    </div>
                    <QuestionImage imageKey={currentQuestion.image_key} />
                    
                    {/* Image movement controls directly below the image */}
                    <div className="mt-4 p-4 border rounded-lg bg-muted/30">
                      <div className="flex items-center gap-2 mb-3">
                        <Move className="h-4 w-4" />
                        <Label className="text-sm font-medium">Bild zu anderer Frage verschieben</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Select 
                          value={selectedTargetQuestion?.toString() || ""} 
                          onValueChange={(value) => setSelectedTargetQuestion(parseInt(value))}
                        >
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Zielfrage wählen" />
                          </SelectTrigger>
                          <SelectContent>
                            {questions.map((item, index) => (
                              <SelectItem 
                                key={index} 
                                value={index.toString()}
                                disabled={index === currentIndex}
                              >
                                Frage {index + 1}: {item.question.substring(0, 50)}...
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button 
                          onClick={handleMoveImage}
                          disabled={selectedTargetQuestion === null}
                          size="sm"
                          className="flex items-center gap-1"
                        >
                          <Move className="h-4 w-4" />
                          Verschieben
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="optionA">Option A</Label>
                    <Input
                      id="optionA"
                      value={currentQuestion.optionA}
                      onChange={(e) => updateQuestion(currentIndex, { optionA: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="optionB">Option B</Label>
                    <Input
                      id="optionB"
                      value={currentQuestion.optionB}
                      onChange={(e) => updateQuestion(currentIndex, { optionB: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="optionC">Option C</Label>
                    <Input
                      id="optionC"
                      value={currentQuestion.optionC}
                      onChange={(e) => updateQuestion(currentIndex, { optionC: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="optionD">Option D</Label>
                    <Input
                      id="optionD"
                      value={currentQuestion.optionD}
                      onChange={(e) => updateQuestion(currentIndex, { optionD: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="optionE">Option E</Label>
                    <Input
                      id="optionE"
                      value={currentQuestion.optionE}
                      onChange={(e) => updateQuestion(currentIndex, { optionE: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label>Richtige Antwort</Label>
                    <RadioGroup
                      value={currentQuestion.correctAnswer}
                      onValueChange={(value) => updateQuestion(currentIndex, { correctAnswer: value })}
                      className="flex space-x-4 mt-1"
                    >
                      {['A', 'B', 'C', 'D', 'E'].map((option) => (
                        <div key={option} className="flex items-center space-x-1">
                          <RadioGroupItem value={option} id={`answer-${option}`} />
                          <Label htmlFor={`answer-${option}`}>{option}</Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="subject">Fach</Label>
                    <Input
                      id="subject"
                      value={currentQuestion.subject}
                      onChange={(e) => updateQuestion(currentIndex, { subject: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="difficulty">Schwierigkeitsgrad</Label>
                    <Select 
                      value={currentQuestion.difficulty.toString()} 
                      onValueChange={(value) => updateQuestion(currentIndex, { difficulty: parseInt(value) })}
                    >
                      <SelectTrigger id="difficulty" className="mt-1">
                        <SelectValue placeholder="Schwierigkeitsgrad auswählen" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 - Sehr einfach</SelectItem>
                        <SelectItem value="2">2 - Einfach</SelectItem>
                        <SelectItem value="3">3 - Mittel</SelectItem>
                        <SelectItem value="4">4 - Schwer</SelectItem>
                        <SelectItem value="5">5 - Sehr schwer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="md:col-span-2">
                    <Label htmlFor="comment">Kommentar (optional)</Label>
                    <Textarea
                      id="comment"
                      value={currentQuestion.comment || ''}
                      onChange={(e) => updateQuestion(currentIndex, { comment: e.target.value })}
                      className="mt-1"
                      rows={2}
                    />
                  </div>
                </div>
                
                <Accordion type="single" collapsible>
                  <AccordionItem value="additional-info">
                    <AccordionTrigger>Zusätzliche Informationen</AccordionTrigger>
                    <AccordionContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                        <div>
                          <Label htmlFor="semester">Semester (optional)</Label>
                          <Input
                            id="semester"
                            value={currentQuestion.semester || ''}
                            onChange={(e) => updateQuestion(currentIndex, { semester: e.target.value })}
                            className="mt-1"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="year">Jahr (optional)</Label>
                          <Input
                            id="year"
                            value={currentQuestion.year || ''}
                            onChange={(e) => updateQuestion(currentIndex, { year: e.target.value })}
                            className="mt-1"
                          />
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="ai-subject-assignment">
                    <AccordionTrigger className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      KI-Fach-Zuweisung
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4 pt-2">
                        <p className="text-sm text-muted-foreground">
                          Lass eine KI automatisch passende Fächer für alle Fragen auswählen. Gib eine kommagetrennte Liste möglicher Fächer ein.
                        </p>
                        
                        <div>
                          <Label htmlFor="subject-list">Verfügbare Fächer (kommagetrennt)</Label>
                          <Textarea
                            id="subject-list"
                            value={subjectList}
                            onChange={(e) => setSubjectList(e.target.value)}
                            placeholder="z.B. Anatomie, Physiologie, Biochemie, Pharmakologie"
                            className="mt-1"
                            rows={3}
                          />
                        </div>
                        
                        {/* Progress display */}
                        {assignmentProgress && (
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm text-muted-foreground">
                              <span>Fortschritt: {assignmentProgress.processed} von {assignmentProgress.total} Fragen</span>
                              <span>Chunk {assignmentProgress.currentChunk} von {assignmentProgress.totalChunks}</span>
                            </div>
                            <Progress 
                              value={assignmentProgress.total > 0 ? (assignmentProgress.processed / assignmentProgress.total) * 100 : 0} 
                              className="w-full"
                            />
                          </div>
                        )}
                        
                        <Button 
                          onClick={handleLLMSubjectAssignment}
                          disabled={isAssigningSubjects || !subjectList.trim()}
                          className="flex items-center gap-2 w-full"
                        >
                          {isAssigningSubjects ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Weise Fächer zu...
                            </>
                          ) : (
                            <>
                              <Sparkles className="h-4 w-4" />
                              Fächer automatisch zuweisen
                            </>
                          )}
                        </Button>
                        
                        {isAssigningSubjects && (
                          <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                              Die KI analysiert jede Frage und weist das passende Fach zu. 
                              {assignmentProgress && (
                                <div className="mt-2">
                                  <strong>Verarbeitung läuft:</strong> {assignmentProgress.processed} von {assignmentProgress.total} Fragen bearbeitet
                                  {assignmentProgress.totalChunks > 1 && (
                                    <span> (Chunk {assignmentProgress.currentChunk} von {assignmentProgress.totalChunks})</span>
                                  )}
                                </div>
                              )}
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            </TabsContent>
            
            <TabsContent value="images" className="mt-6">
              <ImageAssignment 
                questions={questions}
                onImageReassign={handleImageReassign}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
        
        <CardFooter className="flex justify-between">
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onCancel}
              disabled={isSaving}
            >
              {isEditMode ? 'Fertig' : 'Abbrechen'}
            </Button>
            
            {activeTab === 'review' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleRemoveQuestion(currentIndex)}
                disabled={questions.length <= 1 || isSaving}
              >
                Frage entfernen
              </Button>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            {activeTab === 'review' && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrevious}
                  disabled={currentIndex === 0 || isSaving}
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Zurück
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNext}
                  disabled={currentIndex === questions.length - 1 || isSaving}
                >
                  Weiter
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </>
            )}
            
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="relative"
            >
              {isSaving ? (
                <>
                  <LoaderCircle className="h-4 w-4 mr-2 animate-spin" />
                  Speichere...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-1" />
                  {isEditMode ? 'Änderungen speichern' : 'Alle speichern'}
                </>
              )}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default PDFQuestionReview;
