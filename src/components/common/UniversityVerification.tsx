
import React from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { University } from '@/types/models/University';
import { Shield, AlertCircle, CheckCircle } from 'lucide-react';

interface UniversityVerificationProps {
  university?: University | null;
  onVerificationComplete?: () => void;
}

const UniversityVerification: React.FC<UniversityVerificationProps> = ({ 
  university,
  onVerificationComplete 
}) => {
  const { user, profile, verifyUniversityEmail } = useAuth();
  const [isVerifying, setIsVerifying] = React.useState(false);

  const handleVerify = async () => {
    if (!user?.email) {
      toast.error('You need to have an email to verify university membership');
      return;
    }

    setIsVerifying(true);
    try {
      const { success, message } = await verifyUniversityEmail();
      
      if (success && onVerificationComplete) {
        onVerificationComplete();
      } else if (!success && message) {
        toast.error(message);
      }
    } catch (error) {
      console.error('Error verifying university email:', error);
      toast.error('Failed to verify university email');
    } finally {
      setIsVerifying(false);
    }
  };

  if (!user?.email) {
    return (
      <Card className="border-yellow-200 bg-yellow-50">
        <CardHeader className="pb-2">
          <CardTitle className="text-yellow-800 flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Email Required
          </CardTitle>
          <CardDescription className="text-yellow-700">
            You need to have an email address associated with your account to use university features.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (profile?.is_email_verified && profile?.university) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardHeader className="pb-2">
          <CardTitle className="text-green-800 flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Verified University Member
          </CardTitle>
          <CardDescription className="text-green-700">
            You are a verified member of {profile.university.name}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const emailDomain = user.email.split('@')[1];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          University Verification
        </CardTitle>
        <CardDescription>
          Verify your university email to access university-shared questions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-slate-600 mb-2">
          Your email domain <span className="font-semibold">{emailDomain}</span> will be 
          checked against our database of registered universities.
        </p>
        {university ? (
          <p className="text-sm text-green-600 font-medium">
            Your email matches {university.name}
          </p>
        ) : (
          <p className="text-sm text-yellow-600">
            We couldn't automatically detect your university. Please contact support if your 
            university should be in our system.
          </p>
        )}
      </CardContent>
      <CardFooter>
        <Button 
          variant="default" 
          onClick={handleVerify}
          disabled={isVerifying || !university}
        >
          {isVerifying ? 'Verifying...' : 'Verify University Email'}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default UniversityVerification;
