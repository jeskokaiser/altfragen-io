
import React, { useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Image as ImageIcon, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface QuestionImageProps {
  imageKey: string | null | undefined;
}

const QuestionImage: React.FC<QuestionImageProps> = ({ imageKey }) => {
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [imageUrl, setImageUrl] = React.useState<string | null>(null);
  
  useEffect(() => {
    if (!imageKey) return;
    
    const fetchImage = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Get a signed URL using authenticated request
        const { data, error } = await supabase
          .storage
          .from('exam-images')
          .createSignedUrl(imageKey, 3600); // URL valid for 1 hour
        
        if (error) {
          console.error('Error fetching image URL:', error);
          throw error;
        }
        
        if (data?.signedUrl) {
          setImageUrl(data.signedUrl);
        } else {
          throw new Error('No signed URL returned');
        }
      } catch (err) {
        console.error('Failed to load image:', err);
        setError('Bild konnte nicht geladen werden');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchImage();
  }, [imageKey]);
  
  const handleImageLoad = () => {
    setIsLoading(false);
  };
  
  const handleImageError = () => {
    setIsLoading(false);
    setError('Bild konnte nicht geladen werden');
  };
  
  if (!imageKey) return null;
  
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
          imageUrl && (
            <img 
              src={imageUrl} 
              alt="Frage Abbildung" 
              className={`w-full object-contain max-h-96 ${isLoading ? 'hidden' : 'block'}`}
              onLoad={handleImageLoad}
              onError={handleImageError}
            />
          )
        )}
      </Card>
    </div>
  );
};

export default QuestionImage;
