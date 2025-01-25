import React from 'react';
import { RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface AnswerOptionProps {
  value: string;
  text: string;
}

const AnswerOption: React.FC<AnswerOptionProps> = ({ value, text }) => {
  return (
    <div className="flex items-center space-x-2">
      <RadioGroupItem value={value} id={value} />
      <Label htmlFor={value} className="flex items-center">
        <span className="font-semibold mr-2">{value})</span> {text}
      </Label>
    </div>
  );
};

export default AnswerOption;