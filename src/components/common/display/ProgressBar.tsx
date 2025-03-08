
import React from 'react';

interface ProgressBarProps {
  currentIndex: number;
  totalQuestions: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ currentIndex, totalQuestions }) => {
  return (
    <div className="w-full">
      <div className="w-full bg-slate-200 h-2 rounded-full">
        <div
          className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / totalQuestions) * 100}%` }}
        />
      </div>
      <p className="text-right text-sm text-slate-600 mt-2">
        Frage {currentIndex + 1} von {totalQuestions}
      </p>
    </div>
  );
};

export default ProgressBar;
