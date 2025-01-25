import React from 'react';
import { Question } from '@/types/Question';

interface DatasetQuestionListProps {
  questions: Question[];
  isSelected: boolean;
}

const DatasetQuestionList: React.FC<DatasetQuestionListProps> = ({
  questions,
  isSelected,
}) => {
  if (!isSelected) return null;

  return (
    <div className="mt-4 space-y-4">
      <h3 className="font-semibold">Fragen:</h3>
      {questions.map((question, index) => (
        <div key={question.id} className="p-4 bg-slate-50 rounded-lg">
          <p className="font-medium">Frage {index + 1}:</p>
          <p className="mt-1">{question.question}</p>
          <div className="mt-2 space-y-1">
            <p>A: {question.optionA}</p>
            <p>B: {question.optionB}</p>
            <p>C: {question.optionC}</p>
            <p>D: {question.optionD}</p>
            {question.optionE && <p>E: {question.optionE}</p>}
          </div>
          <p className="mt-2 text-green-600">Richtige Antwort: {question.correctAnswer}</p>
          {question.comment && (
            <p className="mt-2 text-slate-600">Kommentar: {question.comment}</p>
          )}
        </div>
      ))}
    </div>
  );
};

export default DatasetQuestionList;