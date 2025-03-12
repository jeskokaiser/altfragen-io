
import React from 'react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { QuestionVisibility } from '@/types/api/database';
import { useAuth } from '@/contexts/AuthContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface VisibilitySelectorProps {
  visibility: QuestionVisibility;
  onChange: (visibility: QuestionVisibility) => void;
}

const VisibilitySelector: React.FC<VisibilitySelectorProps> = ({ 
  visibility, 
  onChange 
}) => {
  const { profile } = useAuth();
  const isUniversityVerified = profile?.is_email_verified && profile?.university_id;
  
  return (
    <div className="space-y-3">
      <div>
        <Label htmlFor="visibility">Question Visibility</Label>
        <RadioGroup 
          value={visibility} 
          onValueChange={(v) => onChange(v as QuestionVisibility)}
          className="mt-2 flex flex-col space-y-1"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="private" id="visibility-private" />
            <Label htmlFor="visibility-private" className="font-normal cursor-pointer">
              Private (only you)
            </Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <RadioGroupItem 
              value="university" 
              id="visibility-university"
              disabled={!isUniversityVerified}
            />
            <Label 
              htmlFor="visibility-university" 
              className={`font-normal cursor-pointer ${!isUniversityVerified ? 'text-gray-400' : ''}`}
            >
              University ({profile?.university?.name || 'Your university'})
            </Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="public" id="visibility-public" />
            <Label htmlFor="visibility-public" className="font-normal cursor-pointer">
              Public (everyone)
            </Label>
          </div>
        </RadioGroup>
      </div>
      
      {!isUniversityVerified && visibility === 'university' && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            To share with your university, you need to verify your university email in settings.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default VisibilitySelector;
