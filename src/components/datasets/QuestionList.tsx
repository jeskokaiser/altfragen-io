
import React from 'react';
import { Question } from '@/types/Question';
import { CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { GraduationCap, Globe, Lock } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface QuestionListProps {
  questions: Question[];
  isSelected: boolean;
}

const QuestionList: React.FC<QuestionListProps> = ({ questions, isSelected }) => {
  if (!isSelected) return null;

  const getVisibilityIcon = (visibility?: string) => {
    switch (visibility) {
      case 'university':
        return <GraduationCap className="h-4 w-4 text-blue-500" />;
      case 'public':
        return <Globe className="h-4 w-4 text-green-500" />;
      default:
        return <Lock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getVisibilityTooltip = (visibility?: string) => {
    switch (visibility) {
      case 'university':
        return "Mit Universität geteilt";
      case 'public':
        return "Öffentlich für alle Nutzer";
      default:
        return "Privat (nur für dich)";
    }
  };

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
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center justify-center w-6 h-6">
                        {getVisibilityIcon(question.visibility)}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{getVisibilityTooltip(question.visibility)}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
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
