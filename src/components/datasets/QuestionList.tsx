
import React from 'react';
import { Question } from '@/types/Question';
import { CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface QuestionListProps {
  questions: Question[];
  isSelected: boolean;
  isLoading?: boolean;
  showFilters?: boolean;
}

const QuestionList: React.FC<QuestionListProps> = ({ 
  questions, 
  isSelected,
  isLoading = false,
  showFilters = false
}) => {
  if (!isSelected && !showFilters) return null;
  
  if (isLoading) {
    return (
      <>
        <Separator />
        <CardContent className="pt-6">
          <div className="flex justify-center py-4">Loading...</div>
        </CardContent>
      </>
    );
  }

  return (
    <>
      <Separator />
      <CardContent className="pt-6">
        <h3 className="font-semibold mb-4">Fragen:</h3>
        <div className="space-y-4">
          {questions.map((question, index) => (
            <div key={question.id} className="p-4 bg-slate-50 rounded-lg space-y-3">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm text-muted-foreground">Frage {index + 1}</span>
              </div>
              <p className="font-medium">{question.question}</p>
              <div className="space-y-2 pl-4">
                <p className="text-sm">A: {question.optionA}</p>
                <p className="text-sm">B: {question.optionB}</p>
                <p className="text-sm">C: {question.optionC}</p>
                <p className="text-sm">D: {question.optionD}</p>
                {question.optionE && <p className="text-sm">E: {question.optionE}</p>}
              </div>
              <div className="pt-2 border-t">
                <p className="text-sm text-green-600">Richtige Antwort: {question.correctAnswer}</p>
                {question.comment && (
                  <p className="text-sm text-slate-600 mt-2">Kommentar: {question.comment}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </>
  );
};

export default QuestionList;
