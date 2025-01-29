import React, { useState } from 'react';
import { RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";

interface AnswerOptionProps {
  value: string;
  text: string;
}

const AnswerOption: React.FC<AnswerOptionProps> = ({ value, text }) => {
  const [isStrikethrough, setIsStrikethrough] = useState(false);

  const handleStrikethrough = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsStrikethrough(!isStrikethrough);
  };

  return (
    <div className="flex items-center space-x-2">
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
        <X className="h-4 w-4 text-gray-500" />
      </button>
    </div>
  );
};

export default AnswerOption;