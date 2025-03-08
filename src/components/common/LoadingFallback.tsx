
import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingFallbackProps {
  message?: string;
}

const LoadingFallback: React.FC<LoadingFallbackProps> = ({ message = 'Wird geladen...' }) => {
  return (
    <div className="flex flex-col items-center justify-center p-6 min-h-[100px]">
      <Loader2 className="h-8 w-8 text-primary animate-spin mb-2" />
      <p className="text-muted-foreground">{message}</p>
    </div>
  );
};

export default LoadingFallback;
