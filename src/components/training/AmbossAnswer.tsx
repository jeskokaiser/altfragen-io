import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Check, X, ChevronDown, ChevronUp } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface AmbossAnswerProps {
  optionLetter: 'A' | 'B' | 'C' | 'D' | 'E';
  optionText: string;
  isCorrect: boolean;
  isRevealed: boolean;
  percentage: number | null; // For stats, e.g. 97, or null if no data
  onClick: () => void;
  explanation?: string;
  children?: React.ReactNode;
  wasAttempted?: boolean; // Whether this answer was tried but not yet revealed
  isSelected?: boolean; // Whether this specific answer was clicked by the user
  showPercentage?: boolean; // Whether to show percentage (premium feature)
}

export const AmbossAnswer: React.FC<AmbossAnswerProps> = ({
  optionLetter,
  optionText,
  isCorrect,
  isRevealed,
  percentage,
  onClick,
  explanation,
  children,
  wasAttempted = false,
  isSelected = false,
  showPercentage = true,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [wasRevealed, setWasRevealed] = useState(false);

  // Reset when moving to a new question
  useEffect(() => {
    if (!isRevealed && wasRevealed) {
      // Moving to a new question - reset everything
      setIsExpanded(false);
      setWasRevealed(false);
    }
    if (isRevealed && !wasRevealed) {
      setWasRevealed(true);
    }
  }, [isRevealed, wasRevealed]);

  const handleClick = () => {
    if (isRevealed) {
      // When revealed, just toggle expansion
      setIsExpanded(!isExpanded);
    } else {
      // When not revealed, expand immediately and trigger answer selection
      setIsExpanded(true);
      onClick();
    }
  };
  const stateClasses = isRevealed
    ? isCorrect
      ? 'border-y-[#0b8363] bg-[#d0f1e8] z-10'
      : wasAttempted
        ? 'border-y-red-200 bg-red-50'  // Keep red background for wrong attempted answers even when revealed
        : 'border-y-slate-200'
    : wasAttempted
      ? 'border-y-red-200 bg-red-50 hover:bg-red-100'
      : 'border-y-slate-200 hover:bg-slate-50';

  const letterClasses = isRevealed
    ? isCorrect
      ? 'text-emerald-800'
      : 'text-red-700'
    : wasAttempted
      ? 'text-red-700'
      : 'text-slate-600';

  const icon = isRevealed ? (
    isCorrect ? (
      <Check className="h-5 w-5 text-emerald-800" />
    ) : (
      <X className="h-5 w-5 text-red-700" />
    )
  ) : null;

  const hasChildren = Boolean(explanation || children);
  const expandIcon = (isRevealed && hasChildren) && (
    isExpanded ? (
      <ChevronUp className="h-4 w-4 text-slate-600 ml-2" />
    ) : (
      <ChevronDown className="h-4 w-4 text-slate-600 ml-2" />
    )
  );

  return (
    <div
      className={cn(
        'leading-snug relative cursor-pointer -my-px border-y-[1px]',
        stateClasses
      )}
      onClick={handleClick}
    >
      <div className="pl-6 pr-4 py-3 flex items-center cursor-pointer">
        <div role="button" className="pr-2 grow flex relative items-center cursor-pointer">
          <div className={cn(
            'leading-none text-lg shrink-0 flex font-bold uppercase justify-center items-center cursor-pointer',
            letterClasses
          )}>
            {optionLetter}
          </div>
          <div className="pl-4 grow cursor-pointer">
            <p className="cursor-pointer text-sm">{optionText}</p>
          </div>
        </div>
        <div className="mr-4 flex justify-center items-end cursor-pointer">
          <p className="text-slate-500 leading-none text-xs font-sans font-semibold cursor-pointer">
            {isRevealed && showPercentage ? (percentage !== null ? `${Math.round(percentage)}%` : '-') : ''}
          </p>
        </div>
        <div className="h-[38px] flex justify-center items-center cursor-pointer gap-1">
          {icon}
          {expandIcon}
        </div>
      </div>
      {isExpanded && (
        <div className="cursor-pointer">
          {hasChildren ? (
            <div className={cn('border-t-[1px] text-sm', isRevealed && isCorrect ? 'border-t-[#0b8363] bg-teal-50' : 'border-t-slate-200')}>
              <div className="pr-6 pl-12 py-2">
                <div className="pl-6 space-y-4 prose prose-sm max-w-none">
                  {explanation && <ReactMarkdown>{explanation}</ReactMarkdown>}
                  {children}
                </div>
              </div>
            </div>
          ) : (
            <div className="border-t-[1px] border-t-slate-200 bg-slate-50 text-sm">
              <div className="pr-6 pl-12 py-2">
                <div className="pl-6">
                  <p className="text-slate-600">Keine KI-Kommentare verfügbar</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}; 