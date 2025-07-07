
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
  keyboardShortcut?: string;
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
  showSolution,
  keyboardShortcut
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
      // When solution is shown, color all answers appropriately with dark mode support
      if (isCorrect) {
        classes += 'bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded-md p-2 text-green-900 dark:text-green-100 ';
      } else {
        classes += 'bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-md p-2 text-red-900 dark:text-red-100 ';
      }
    } else if (showFeedback) {
      if (isFirstWrong) {
        classes += 'bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-md p-2 text-red-900 dark:text-red-100 ';
      } else if (isCorrect && shouldHighlightCorrect) {
        classes += 'bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded-md p-2 text-green-900 dark:text-green-100 ';
      } else if (isWrong && !isFirstWrong) {
        classes += 'border border-red-600 dark:border-red-400 rounded-md p-2 ';
      } else {
        classes += 'border border-gray-200 dark:border-gray-700 rounded-md p-2 ';
      }
    }
    
    return classes;
  };

  return (
    <div className={getContainerClasses()}>
      <RadioGroupItem value={value} id={value} />
      <Label htmlFor={value} className="flex items-center flex-1">
        <span className="font-semibold mr-2">{value})</span>
        <span className={`flex-1 ${isStrikethrough ? 'line-through' : ''}`}>
          {text}
        </span>
        {keyboardShortcut && !isMobile && (
          <span className="text-xs bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded text-gray-600 dark:text-gray-300 ml-2">
            {keyboardShortcut}
          </span>
        )}
      </Label>
      <button
        onClick={handleStrikethrough}
        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
        aria-label="Toggle strike-through"
      >
        <X className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'} text-gray-500 dark:text-gray-400`} />
      </button>
    </div>
  );
};

export default AnswerOption;
