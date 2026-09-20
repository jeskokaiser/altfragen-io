import React from 'react';
const DashboardHeader: React.FC = () => {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-2">
      <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-zinc-50">Dashboard</h1>
    </div>
  );
};
export default DashboardHeader;
