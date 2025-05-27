
import React, { useState, useEffect } from 'react';
import { RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";
import { useIsMobile } from '@/hooks/use-mobile';

interface AnswerOptionProps {
  value: string;
  text: string;
  resetTrigger?: number;
  isWrong?: boolean;
  isFirstWrong?: boolean;
  isCorrect?: boolean;
  showFeedback?: boolean;
  shouldHighlightCorrect?: boolean;
  showSolution?: boolean;
}

const AnswerOption: React.FC<AnswerOptionProps> = ({ 
  value, 
  text, 
  resetTrigger, 
  isWrong, 
  isFirstWrong, 
  isCorrect, 
  showFeedback,
  shouldHighlightCorrect,
  showSolution
}) => {
  const [isStrikethrough, setIsStrikethrough] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    setIsStrikethrough(false);
  }, [resetTrigger]);

  const handleStrikethrough = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsStrikethrough(!isStrikethrough);
  };

  const getContainerClasses = () => {
    let classes = `flex items-center space-x-2 ${isMobile ? 'text-sm' : ''} `;
    
    if (showSolution) {
      // When solution is shown, color all answers appropriately
      if (isCorrect) {
        classes += 'bg-green-100 border border-green-300 rounded-md p-2 ';
      } else {
        classes += 'bg-red-100 border border-red-300 rounded-md p-2 ';
      }
    } else if (showFeedback) {
      if (isFirstWrong) {
        classes += 'bg-red-100 border border-red-300 rounded-md p-2 ';
      } else if (isCorrect && shouldHighlightCorrect) {
        classes += 'bg-green-100 border border-green-300 rounded-md p-2 ';
      } else if (isWrong && !isFirstWrong) {
        classes += 'border border-red-600 rounded-md p-2 ';
      } else {
        classes += 'border border-gray-200 rounded-md p-2 ';
      }
    }
    
    return classes;
  };

  return (
    <div className={getContainerClasses()}>
      <RadioGroupItem value={value} id={value} />
      <Label htmlFor={value} className="flex items-center flex-1">
        <span className="font-semibold mr-2">{value})</span>
        <span className={isStrikethrough ? 'line-through' : ''}>
          {text}
        </span>
      </Label>
      <button
        onClick={handleStrikethrough}
        className="p-1 hover:bg-gray-100 rounded-full transition-colors"
        aria-label="Toggle strike-through"
      >
        <X className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'} text-gray-500`} />
      </button>
    </div>
  );
};

export default AnswerOption;
