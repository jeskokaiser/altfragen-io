
import React, { useState } from 'react';
import { Question } from '@/types/Question';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Check, X, AlertCircle, Save, ArrowLeft, ArrowRight } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface PDFQuestionReviewProps {
  questions: Question[];
  visibility: 'private' | 'university';
  onSave: (questions: Question[]) => void;
  onCancel: () => void;
  filename: string;
}

const PDFQuestionReview: React.FC<PDFQuestionReviewProps> = ({ 
  questions: initialQuestions, 
  visibility, 
  onSave, 
  onCancel,
  filename
}) => {
  const [questions, setQuestions] = useState<Question[]>(initialQuestions);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [validationErrors, setValidationErrors] = useState<{[key: number]: string[]}>({});
  
  const currentQuestion = questions[currentIndex];
  
  const updateQuestion = (index: number, updates: Partial<Question>) => {
    const updatedQuestions = [...questions];
    updatedQuestions[index] = { ...updatedQuestions[index], ...updates };
    setQuestions(updatedQuestions);
  };
  
  const validateQuestion = (question: Question, index: number): string[] => {
    const errors: string[] = [];
    
    if (!question.question || question.question.trim() === '') {
      errors.push('Frage darf nicht leer sein');
    }
    
    if (!question.optionA || question.optionA.trim() === '') {
      errors.push('Option A darf nicht leer sein');
    }
    
    if (!question.optionB || question.optionB.trim() === '') {
      errors.push('Option B darf nicht leer sein');
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
  
  return (
    <div className="w-full">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>Überprüfe extrahierte Fragen</span>
            <span className="text-sm font-normal text-muted-foreground">
              {currentIndex + 1} von {questions.length}
            </span>
          </CardTitle>
          <CardDescription>
            Die PDF-Datei "{filename}" wurde verarbeitet. Bitte überprüfe die extrahierten Fragen und korrigiere sie bei Bedarf.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
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
            </Accordion>
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-between">
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onCancel}
            >
              Abbrechen
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleRemoveQuestion(currentIndex)}
              disabled={questions.length <= 1}
            >
              Frage entfernen
            </Button>
          </div>
          
          <div className="flex items-center space-x-2">
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
            
            <Button
              onClick={handleSave}
            >
              <Save className="h-4 w-4 mr-1" />
              Alle speichern
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default PDFQuestionReview;
