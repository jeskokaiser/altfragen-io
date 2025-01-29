import React from 'react';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';

const DashboardHeader = () => {
  return (
    <div className="flex flex-col space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-800">Deine Fragen</h1>
        <Button variant="outline" onClick={() => document.getElementById('csv-upload')?.click()}>
          <Upload className="mr-2 h-4 w-4" />
          CSV hochladen
        </Button>
      </div>
      <p className="text-muted-foreground">
        Lade eine CSV-Datei hoch oder wähle einen bestehenden Datensatz aus, um mit dem Training zu beginnen.
      </p>
    </div>
  );
};

export default DashboardHeader;