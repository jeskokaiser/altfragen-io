
import React from 'react';
import { Card } from '@/components/ui/card';
import { Image as ImageIcon, AlertCircle } from 'lucide-react';

interface QuestionImageProps {
  imageKey: string | null | undefined;
}

const QuestionImage: React.FC<QuestionImageProps> = ({ imageKey }) => {
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  
  if (!imageKey) return null;
  
  const imageUrl = `https://ynzxzhpivcmkpipanltd.supabase.co/storage/v1/object/public/exam-images/${imageKey}`;
  
  const handleImageLoad = () => {
    setIsLoading(false);
  };
  
  const handleImageError = () => {
    setIsLoading(false);
    setError('Bild konnte nicht geladen werden');
  };
  
  return (
    <div className="mt-4 mb-6">
      <Card className="overflow-hidden">
        {isLoading && (
          <div className="flex justify-center items-center p-12 bg-muted/30">
            <ImageIcon className="h-16 w-16 text-muted-foreground/40" />
          </div>
        )}
        
        {error ? (
          <div className="flex flex-col justify-center items-center p-12 bg-muted/30 text-muted-foreground">
            <AlertCircle className="h-10 w-10 mb-2" />
            <p>{error}</p>
          </div>
        ) : (
          <img 
            src={imageUrl} 
            alt="Frage Abbildung" 
            className={`w-full object-contain max-h-96 ${isLoading ? 'hidden' : 'block'}`}
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
        )}
      </Card>
    </div>
  );
};

export default QuestionImage;
