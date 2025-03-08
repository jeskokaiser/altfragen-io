
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
}

const AnswerOption: React.FC<AnswerOptionProps> = ({ value, text, resetTrigger, isWrong }) => {
  const [isStrikethrough, setIsStrikethrough] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    setIsStrikethrough(false);
  }, [resetTrigger]);

  const handleStrikethrough = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsStrikethrough(!isStrikethrough);
  };

  return (
    <div className={`flex items-center space-x-2 ${isMobile ? 'text-sm' : ''} ${
      isWrong ? 'border border-[#ea384c] rounded-md p-2' : ''
    }`}>
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
