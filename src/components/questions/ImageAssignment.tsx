
import React, { useState } from 'react';
import { Question } from '@/types/Question';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Image as ImageIcon, Move, ArrowRight } from 'lucide-react';
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

        <div className="flex justify-center">
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
            <QuestionImage imageKey={questions[selectedSourceQuestion].image_key} />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ImageAssignment;
