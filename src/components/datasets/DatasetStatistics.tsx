import React from 'react';

interface DatasetStatisticsProps {
  totalQuestions: number;
  answeredQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
}

const DatasetStatistics: React.FC<DatasetStatisticsProps> = ({
  totalQuestions,
  answeredQuestions,
  correctAnswers,
  wrongAnswers,
}) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div className="bg-slate-50 p-4 rounded-lg text-center">
        <p className="text-2xl font-bold text-slate-800">{totalQuestions}</p>
        <p className="text-sm text-slate-600">Gesamt Fragen</p>
      </div>
      <div className="bg-slate-50 p-4 rounded-lg text-center">
        <p className="text-2xl font-bold text-slate-800">{answeredQuestions}</p>
        <p className="text-sm text-slate-600">Beantwortet</p>
      </div>
      <div className="bg-green-50 p-4 rounded-lg text-center">
        <p className="text-2xl font-bold text-green-600">{correctAnswers}</p>
        <p className="text-sm text-green-600">Richtig</p>
      </div>
      <div className="bg-red-50 p-4 rounded-lg text-center">
        <p className="text-2xl font-bold text-red-600">{wrongAnswers}</p>
        <p className="text-sm text-red-600">Falsch</p>
      </div>
    </div>
  );
};

export default DatasetStatistics;