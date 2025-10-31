
import React from 'react';
import { Link } from 'react-router-dom';

const TrainingLanding: React.FC = () => {
  return (
    <div className="container mx-auto py-8">
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Training</h1>
        <p className="text-muted-foreground">Starte eine gespeicherte Session oder lege eine neue an.</p>
        <div className="flex gap-3">
          <Link to="/training/sessions" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">Sessions öffnen</Link>
          <Link to="/dashboard" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">Fragen auswählen</Link>
        </div>
      </div>
    </div>
  );
};

export default TrainingLanding;
