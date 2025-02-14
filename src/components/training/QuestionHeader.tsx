
import React from 'react';
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { createQuestionPrompt, copyToClipboard } from '@/utils/questionPrompt';
import { Question } from '@/types/Question';

interface QuestionHeaderProps {
  questionData: Question;
}

const QuestionHeader: React.FC<QuestionHeaderProps> = ({ questionData }) => {
  const handleCopyToClipboard = async () => {
    if (!questionData) return;
    const prompt = createQuestionPrompt(questionData);
    await copyToClipboard(prompt);
  };

  if (!questionData) {
    return null;
  }

  return (
    <div className="flex justify-between items-start mb-4">
      <h3 className="text-xl font-semibold text-slate-800 dark:text-white">
        {questionData.question}
      </h3>
      <Button
        variant="outline"
        size="sm"
        onClick={handleCopyToClipboard}
        className="ml-2 flex items-center gap-2"
      >
        <Copy className="h-4 w-4" />
        <span className="hidden sm:inline">Kopieren</span>
      </Button>
    </div>
  );
};

export default QuestionHeader;
