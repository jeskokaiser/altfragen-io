
import React, { useState } from 'react';
import { Question } from '@/types/Question';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Image as ImageIcon, Move, ArrowRight, ArrowLeft, ArrowUp, ArrowDown } from 'lucide-react';
import QuestionImage from './QuestionImage';

interface ImageAssignmentProps {
  questions: Question[];
  onImageReassign: (fromQuestionIndex: number, toQuestionIndex: number) => void;
}

const ImageAssignment: React.FC<ImageAssignmentProps> = ({ 
  questions, 
  onImageReassign 
}) => {
  const [selectedSourceQuestion, setSelectedSourceQuestion] = useState<number | null>(null);
  const [selectedTargetQuestion, setSelectedTargetQuestion] = useState<number | null>(null);

  const questionsWithImages = questions
    .map((q, index) => ({ question: q, index }))
    .filter(item => item.question.image_key);

  const allQuestions = questions.map((q, index) => ({ question: q, index }));

  const handleReassign = () => {
    if (selectedSourceQuestion !== null && selectedTargetQuestion !== null) {
      onImageReassign(selectedSourceQuestion, selectedTargetQuestion);
      setSelectedSourceQuestion(null);
      setSelectedTargetQuestion(null);
    }
  };

  const getAdjacentQuestions = (questionIndex: number) => {
    const previous = questionIndex > 0 ? questions[questionIndex - 1] : null;
    const next = questionIndex < questions.length - 1 ? questions[questionIndex + 1] : null;
    return { previous, next };
  };

  const moveToAdjacent = (fromIndex: number, direction: 'previous' | 'next') => {
    const targetIndex = direction === 'previous' ? fromIndex - 1 : fromIndex + 1;
    if (targetIndex >= 0 && targetIndex < questions.length) {
      onImageReassign(fromIndex, targetIndex);
    }
  };

  if (questionsWithImages.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>Keine Bilder in den extrahierten Fragen gefunden</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Move className="h-5 w-5" />
          Bilder neu zuordnen
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Quick adjacent movement section */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-muted-foreground">Schnelle Bewegung zu benachbarten Fragen</h4>
          {questionsWithImages.map((item) => {
            const { previous, next } = getAdjacentQuestions(item.index);
            return (
              <Card key={item.index} className="p-4">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="text-sm font-medium text-muted-foreground mb-1">
                        Frage {item.index + 1} (mit Bild)
                      </div>
                      <div className="text-sm">
                        {item.question.question.length > 150 
                          ? `${item.question.question.substring(0, 150)}...` 
                          : item.question.question}
                      </div>
                    </div>
                  </div>
                  
                  {/* Show the image */}
                  <div className="max-w-xs">
                    <QuestionImage imageKey={item.question.image_key} />
                  </div>
                  
                  {/* Adjacent questions context */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    {previous && (
                      <div className="p-2 bg-muted/30 rounded border-l-2 border-blue-200">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-blue-600">Vorherige Frage ({item.index})</span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => moveToAdjacent(item.index, 'previous')}
                            className="h-6 px-2 text-xs"
                          >
                            <ArrowUp className="h-3 w-3 mr-1" />
                            Bild hierhin
                          </Button>
                        </div>
                        <div className="text-muted-foreground">
                          {previous.question.length > 100 
                            ? `${previous.question.substring(0, 100)}...` 
                            : previous.question}
                        </div>
                      </div>
                    )}
                    
                    {next && (
                      <div className="p-2 bg-muted/30 rounded border-l-2 border-green-200">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-green-600">Nächste Frage ({item.index + 2})</span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => moveToAdjacent(item.index, 'next')}
                            className="h-6 px-2 text-xs"
                          >
                            <ArrowDown className="h-3 w-3 mr-1" />
                            Bild hierhin
                          </Button>
                        </div>
                        <div className="text-muted-foreground">
                          {next.question.length > 100 
                            ? `${next.question.substring(0, 100)}...` 
                            : next.question}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Manual assignment section */}
        <div className="pt-4 border-t">
          <h4 className="text-sm font-medium text-muted-foreground mb-4">Manuelle Zuweisung zu beliebiger Frage</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <label className="text-sm font-medium mb-2 block">Von Frage (mit Bild)</label>
              <Select 
                value={selectedSourceQuestion?.toString() || ""} 
                onValueChange={(value) => setSelectedSourceQuestion(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Quellfrage wählen" />
                </SelectTrigger>
                <SelectContent>
                  {questionsWithImages.map((item) => (
                    <SelectItem key={item.index} value={item.index.toString()}>
                      Frage {item.index + 1}: {item.question.question.substring(0, 50)}...
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-center">
              <ArrowRight className="h-6 w-6 text-muted-foreground" />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Zu Frage</label>
              <Select 
                value={selectedTargetQuestion?.toString() || ""} 
                onValueChange={(value) => setSelectedTargetQuestion(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Zielfrage wählen" />
                </SelectTrigger>
                <SelectContent>
                  {allQuestions.map((item) => (
                    <SelectItem key={item.index} value={item.index.toString()}>
                      Frage {item.index + 1}: {item.question.question.substring(0, 50)}...
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-center mt-4">
            <Button 
              onClick={handleReassign}
              disabled={selectedSourceQuestion === null || selectedTargetQuestion === null}
              className="flex items-center gap-2"
            >
              <Move className="h-4 w-4" />
              Bild verschieben
            </Button>
          </div>

          {selectedSourceQuestion !== null && (
            <div className="mt-6">
              <h4 className="text-sm font-medium mb-2">Vorschau des zu verschiebenden Bildes:</h4>
              <div className="max-w-md">
                <QuestionImage imageKey={questions[selectedSourceQuestion].image_key} />
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ImageAssignment;
