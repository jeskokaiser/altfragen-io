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
import { Check, X, AlertCircle, Save, ArrowLeft, ArrowRight, Image as ImageIcon, Trash2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from '@/components/ui/badge';
import QuestionImage from './questions/QuestionImage';
import ImageAssignment from './questions/ImageAssignment';

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
  const [questions, setQuestions] = useState<Question[]>(initialQuestions);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [validationErrors, setValidationErrors] = useState<{[key: number]: string[]}>({});
  const [batchSubject, setBatchSubject] = useState('');
  const [batchSemester, setBatchSemester] = useState('');
  const [batchYear, setBatchYear] = useState('');
  const [activeTab, setActiveTab] = useState('review');
  
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
  }, [activeTab, currentIndex, questions.length, validationErrors]);
  
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
  };
  
  const validateQuestion = (question: Question, index: number): string[] => {
    const errors: string[] = [];
    
    if (!question.question || question.question.trim() === '') {
      errors.push('Frage darf nicht leer sein');
    }
    
    if (!question.correctAnswer || !['A', 'B', 'C', 'D', 'E'].includes(question.correctAnswer)) {
      errors.push('Eine gültige Antwort muss ausgewählt sein (A-E)');
    }
    
    if (!question.subject || question.subject.trim() === '') {
      errors.push('Fach darf nicht leer sein');
    }
    
    return errors;
  };
  
  const handleNext = () => {
    const errors = validateQuestion(currentQuestion, currentIndex);
    
    if (errors.length > 0) {
      setValidationErrors({
        ...validationErrors,
        [currentIndex]: errors
      });
      return;
    }
    
    // Clear errors for this question
    const newValidationErrors = { ...validationErrors };
    delete newValidationErrors[currentIndex];
    setValidationErrors(newValidationErrors);
    
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };
  
  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };
  
  const handleSave = () => {
    // Validate all questions
    let allValid = true;
    const newValidationErrors: {[key: number]: string[]} = {};
    
    questions.forEach((question, index) => {
      const errors = validateQuestion(question, index);
      if (errors.length > 0) {
        newValidationErrors[index] = errors;
        allValid = false;
      }
    });
    
    if (!allValid) {
      setValidationErrors(newValidationErrors);
      const firstErrorIndex = Object.keys(newValidationErrors)[0];
      setCurrentIndex(parseInt(firstErrorIndex));
      setActiveTab('review'); // Switch back to review tab if there are errors
      return;
    }
    
    // All questions are valid, proceed with save
    onSave(questions.map(q => ({
      ...q,
      visibility
    })));
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
    
    // Update validation errors
    const newValidationErrors = { ...validationErrors };
    delete newValidationErrors[index];
    
    // Shift error indices for questions after the removed one
    Object.keys(newValidationErrors).forEach(key => {
      const keyIndex = parseInt(key);
      if (keyIndex > index) {
        newValidationErrors[keyIndex - 1] = newValidationErrors[keyIndex];
        delete newValidationErrors[keyIndex];
      }
    });
    
    setValidationErrors(newValidationErrors);
  };

  const handleRemoveImage = () => {
    updateQuestion(currentIndex, { image_key: null });
  };

  const applyBatchChanges = () => {
    const updatedQuestions = [...questions];
    
    updatedQuestions.forEach((question, index) => {
      const updates: Partial<Question> = {};
      
      if (batchSubject) {
        updates.subject = batchSubject;
      }
      
      if (batchSemester) {
        updates.semester = batchSemester;
      }
      
      if (batchYear) {
        updates.year = batchYear;
      }
      
      if (Object.keys(updates).length > 0) {
        updatedQuestions[index] = { ...question, ...updates };
      }
    });
    
    setQuestions(updatedQuestions);
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
              {validationErrors[currentIndex] && validationErrors[currentIndex].length > 0 && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <ul className="list-disc pl-5">
                      {validationErrors[currentIndex].map((error, i) => (
                        <li key={i}>{error}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
              
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
                  
                  <AccordionItem value="batch-operations">
                    <AccordionTrigger>Massenbearbeitung</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4 pt-2">
                        <p className="text-sm text-muted-foreground">
                          Änderungen werden auf alle Fragen angewendet, wenn du auf "Anwenden" klickst.
                        </p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <Label htmlFor="batch-subject">Fach</Label>
                            <Input
                              id="batch-subject"
                              value={batchSubject}
                              onChange={(e) => setBatchSubject(e.target.value)}
                              placeholder="Für alle Fragen setzen"
                              className="mt-1"
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor="batch-semester">Semester</Label>
                            <Input
                              id="batch-semester"
                              value={batchSemester}
                              onChange={(e) => setBatchSemester(e.target.value)}
                              placeholder="Für alle Fragen setzen"
                              className="mt-1"
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor="batch-year">Jahr</Label>
                            <Input
                              id="batch-year"
                              value={batchYear}
                              onChange={(e) => setBatchYear(e.target.value)}
                              placeholder="Für alle Fragen setzen"
                              className="mt-1"
                            />
                          </div>
                        </div>
                        
                        <Button onClick={applyBatchChanges} variant="outline" size="sm">
                          Massenänderungen anwenden
                        </Button>
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
            >
              {isEditMode ? 'Fertig' : 'Abbrechen'}
            </Button>
            
            {activeTab === 'review' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleRemoveQuestion(currentIndex)}
                disabled={questions.length <= 1}
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
                  disabled={currentIndex === 0}
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Zurück
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNext}
                  disabled={currentIndex === questions.length - 1}
                >
                  Weiter
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </>
            )}
            
            <Button
              onClick={handleSave}
            >
              <Save className="h-4 w-4 mr-1" />
              {isEditMode ? 'Änderungen speichern' : 'Alle speichern'}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default PDFQuestionReview;
