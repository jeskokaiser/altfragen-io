
import React from 'react';
import { useNavigate } from 'react-router-dom';
import LoadingFallback from '@/components/common/LoadingFallback';

interface ErrorDisplayProps {
  error: Error | null;
  message?: string;
  onReset?: () => void;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ 
  error, 
  message = 'Trainingsdaten konnten nicht geladen werden.',
  onReset
}) => {
  const navigate = useNavigate();
  
  return (
    <div className="container mx-auto py-8">
      <div className="p-6 bg-red-50 dark:bg-red-950/20 rounded-lg text-center">
        <h2 className="text-xl font-semibold text-red-800 dark:text-red-400 mb-2">
          Fehler beim Laden
        </h2>
        <p className="text-red-600 dark:text-red-300 mb-4">
          {error?.message || message}
        </p>
        <button 
          onClick={() => onReset ? onReset() : navigate('/dashboard')}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          Zurück zum Dashboard
        </button>
      </div>
    </div>
  );
};

export const EmptyQuestionsDisplay: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <div className="container mx-auto py-8">
      <div className="p-6 bg-muted rounded-lg text-center">
        <h2 className="text-xl font-semibold mb-2">Keine Fragen vorhanden</h2>
        <p className="mb-4">Bitte wähle zuerst einen Datensatz aus.</p>
        <button 
          onClick={() => navigate('/dashboard')}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          Zum Dashboard
        </button>
      </div>
    </div>
  );
};

export const TrainingLoadingState: React.FC<{message?: string}> = ({ 
  message = "Lade Trainingsdaten..." 
}) => (
  <LoadingFallback message={message} />
);
