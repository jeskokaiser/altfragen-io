
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
        console.log('Attempting to fetch image with key:', imageKey);
        
        // Check if the object exists before creating a signed URL
        const { data: checkData, error: checkError } = await supabase
          .storage
          .from('exam-images')
          .list('', {
            search: imageKey
          });
          
        if (checkError) {
          console.error('Error checking if image exists:', checkError);
          throw checkError;
        }
        
        // If the file doesn't exist in the root, try to see if it's in a subfolder
        if (!checkData || checkData.length === 0) {
          console.log('Image not found in root, checking if it has folder path');
          
          // If imageKey contains path separators, extract the folder path
          if (imageKey.includes('/')) {
            const lastSlashIndex = imageKey.lastIndexOf('/');
            const folderPath = imageKey.substring(0, lastSlashIndex);
            const fileName = imageKey.substring(lastSlashIndex + 1);
            
            console.log(`Checking folder: ${folderPath}, file: ${fileName}`);
            
            const { data: folderCheckData, error: folderCheckError } = await supabase
              .storage
              .from('exam-images')
              .list(folderPath, {
                search: fileName
              });
              
            if (folderCheckError || !folderCheckData || folderCheckData.length === 0) {
              throw new Error(`Image not found in folder ${folderPath}`);
            }
          } else {
            throw new Error(`Image with key ${imageKey} not found`);
          }
        }
        
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
          console.log('Successfully obtained signed URL for image');
          setImageUrl(data.signedUrl);
        } else {
          throw new Error('No signed URL returned');
        }
      } catch (err) {
        console.error('Failed to load image:', err);
        setError('Bild konnte nicht geladen werden');
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
