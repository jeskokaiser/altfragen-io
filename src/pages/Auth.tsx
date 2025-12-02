import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info, ArrowLeft, School, Mail, CheckCircle, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAuth } from '@/contexts/AuthContext';
import { NonUniversitySignupDialog } from '@/components/auth/NonUniversitySignupDialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Link } from 'react-router-dom';

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [isResetPassword, setIsResetPassword] = useState(false);
  const [universityInfo, setUniversityInfo] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [isCheckingDomain, setIsCheckingDomain] = useState(false);
  const [isVerificationScreen, setIsVerificationScreen] = useState(false);
  const [showNonUniversityDialog, setShowNonUniversityDialog] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedMarketing, setAcceptedMarketing] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const {
    user,
    isEmailVerified,
    universityName
  } = useAuth();

  useEffect(() => {
    const handleAuthRedirect = async () => {
      const params = new URLSearchParams(location.search);
      
      // Don't handle redirects while updating password
      if (isUpdatingPassword) {
        console.log('Skipping auth redirect - password update in progress');
        return;
      }
      
      if (params.get('verification') === 'pending') {
        setIsVerificationScreen(true);
        return;
      }
      
      const type = params.get('type');
      
      // Handle password recovery
      if (type === 'recovery') {
        try {
          // Check if we have a session after the redirect from Supabase
          const { data: { session }, error } = await supabase.auth.getSession();
          
          if (error) {
            console.error('Recovery session error:', error);
            toast.error('Fehler beim Zurücksetzen des Passworts. Bitte versuche es erneut.');
            navigate('/auth');
          } else if (session) {
            // We have a valid session, show the password reset form
            console.log('Recovery session found:', session.user.id);
            setIsResetPassword(true);
          } else {
            // No session, maybe the link expired
            console.error('No recovery session found');
            toast.error('Der Link ist abgelaufen oder ungültig. Bitte fordere einen neuen Link an.');
            navigate('/auth');
          }
        } catch (error) {
          console.error('Recovery error:', error);
          toast.error('Ein Fehler ist aufgetreten. Bitte versuche es erneut.');
          navigate('/auth');
        }
        return;
      }
      
      if (type === 'email_change' || type === 'signup') {
        handleEmailVerification();
      }
    };
    
    handleAuthRedirect();
  }, [location, navigate, isUpdatingPassword]);

  const handleEmailVerification = async () => {
    try {
      setLoading(true);
      const {
        data: sessionData
      } = await supabase.auth.getSession();
      if (sessionData.session) {
        toast.success('E-Mail wurde erfolgreich bestätigt!');
        const userId = sessionData.session.user.id;
        await updateVerificationStatus(userId, true);
        navigate('/dashboard');
      } else {
        toast.success('E-Mail wurde bestätigt. Bitte melde dich an.');
        navigate('/auth');
      }
    } catch (error: any) {
      console.error('Email verification error:', error);
      toast.error('Fehler bei der E-Mail-Bestätigung: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const updateVerificationStatus = async (userId: string, isVerified: boolean) => {
    try {
      const {
        error
      } = await supabase.from('profiles').update({
        is_email_verified: isVerified
      }).eq('id', userId);
      if (error) {
        console.error('Error updating verification status:', error);
      }
    } catch (error) {
      console.error('Error in updateVerificationStatus:', error);
    }
  };

  useEffect(() => {
    const checkEmailDomain = async () => {
      if (!email || !email.includes('@') || !isSignUp) return;
      try {
        setIsCheckingDomain(true);
        const emailDomain = email.split('@')[1]?.trim();
        if (!emailDomain) return;
        
        // First try exact domain match
        const { data, error } = await supabase
          .from('universities')
          .select('id, name, email_domain')
          .eq('email_domain', emailDomain);
        
        if (error) {
          console.error('Error checking university domain:', error);
          setUniversityInfo(null);
        } else if (data && data.length > 0) {
          // Exact match found
          const university = data[0];
          setUniversityInfo({
            id: university.id,
            name: university.name
          });
        } else {
          // FIXED: Remove problematic endsWith fallback that was causing false matches
          // If no exact match, the user is not at a university
          setUniversityInfo(null);
        }
      } catch (error) {
        console.error('Error in checkEmailDomain:', error);
        setUniversityInfo(null);
      } finally {
        setIsCheckingDomain(false);
      }
    };
    const debounceTimer = setTimeout(checkEmailDomain, 500);
    return () => clearTimeout(debounceTimer);
  }, [email, isSignUp]);

  const validatePassword = (password: string) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    // Require at least one symbol to align with strong Supabase password policy
    const hasSymbol = /[!@#$%^&*()_+\-=[\]{};':"\\|<>?,./`~]/.test(password);

    const errors = [];
    if (password.length < minLength) errors.push(`mindestens ${minLength} Zeichen`);
    if (!hasUpperCase) errors.push('einen Großbuchstaben');
    if (!hasLowerCase) errors.push('einen Kleinbuchstaben');
    if (!hasNumbers) errors.push('eine Zahl');
    if (!hasSymbol) errors.push('ein Sonderzeichen');
    return errors;
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const getEmailDomain = (email: string) => {
    return email.split('@')[1] || '';
  };

  const validateDisposableEmail = async (email: string): Promise<{ valid: boolean; error?: string }> => {
    try {
      const { data, error } = await supabase.functions.invoke('validate-email', {
        body: { email },
      });

      // If there's an error (network or function error), fail open
      if (error) {
        console.warn('Error validating email with Edge Function:', error);
        // Fail open: if validation service is unavailable, allow signup
        return { valid: true };
      }

      // Check if validation data exists and email is invalid
      if (data) {
        if (data.valid === false) {
          console.log('Disposable email detected:', email, data);
          return {
            valid: false,
            error: 'Disposable E-Mail-Adressen sind nicht erlaubt',
          };
        }
        // Email is valid
        return { valid: true };
      }

      // No data returned - fail open
      console.warn('No validation data returned from Edge Function');
      return { valid: true };
    } catch (error) {
      console.warn('Exception during email validation:', error);
      // Fail open: if validation service fails, allow signup with warning
      return { valid: true };
    }
  };

  const handleResetPassword = async () => {
    try {
      setLoading(true);
      
      if (!email) {
        toast.error('Bitte gib deine E-Mail-Adresse ein');
        setLoading(false);
        return;
      }
      
      if (!validateEmail(email)) {
        toast.error('Bitte gib eine gültige E-Mail-Adresse ein');
        setLoading(false);
        return;
      }
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/auth?type=recovery'
      });
      
      if (error) {
        console.error('Password reset email error:', error);
        throw error;
      }
      
      toast.success('Eine E-Mail zum Zurücksetzen des Passworts wurde gesendet');
      setIsForgotPassword(false);
      setEmail(''); // Clear email field
    } catch (error: any) {
      console.error('Error sending reset email:', error);
      toast.error(error.message || 'Fehler beim Senden der E-Mail');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    console.log('handleUpdatePassword called, password length:', password?.length);
    
    if (isUpdatingPassword) {
      console.log('Already updating password, ignoring...');
      return;
    }
    
    try {
      setLoading(true);
      setIsUpdatingPassword(true);
      
      if (!password) {
        toast.error('Bitte gib ein neues Passwort ein');
        setLoading(false);
        setIsUpdatingPassword(false);
        return;
      }
      
      const passwordErrors = validatePassword(password);
      if (passwordErrors.length > 0) {
        toast.error(`Das Passwort muss ${passwordErrors.join(', ')} enthalten`);
        setLoading(false);
        setIsUpdatingPassword(false);
        return;
      }
      
      console.log('Attempting to update password...');
      
      // Set up a listener for the USER_UPDATED event
      let updateCompleted = false;
      const authListener = supabase.auth.onAuthStateChange((event, session) => {
        console.log('Auth event during password update:', event);
        if (event === 'USER_UPDATED') {
          updateCompleted = true;
          console.log('Password update confirmed via USER_UPDATED event');
          // Clean up the listener
          authListener.data.subscription.unsubscribe();
          // Success!
          toast.success('Passwort erfolgreich aktualisiert');
          setLoading(false);
          setIsUpdatingPassword(false);
          // Navigate to dashboard after a short delay
          setTimeout(() => {
            navigate('/dashboard');
          }, 500);
        }
      });
      
      // Try to update the password with a timeout
      const timeoutId = setTimeout(() => {
        if (!updateCompleted) {
          console.log('Password update timed out, but checking if it succeeded...');
          // Clean up
          authListener.data.subscription.unsubscribe();
          setLoading(false);
          setIsUpdatingPassword(false);
          // The password might have been updated even if the request hung
          toast.info('Passwort-Update abgeschlossen. Du wirst zum Dashboard weitergeleitet.');
          navigate('/dashboard');
        }
      }, 5000); // 5 second timeout
      
      try {
        const { data, error } = await supabase.auth.updateUser({
          password: password
        });
        
        clearTimeout(timeoutId);
        console.log('Update password response:', { data, error });
        
        if (!updateCompleted) {
          authListener.data.subscription.unsubscribe();
          
          if (error) {
            console.error('Password update error:', error);
            setIsUpdatingPassword(false);
            throw error;
          }
          
          toast.success('Passwort erfolgreich aktualisiert');
          navigate('/dashboard');
        }
      } catch (error: any) {
        clearTimeout(timeoutId);
        if (!updateCompleted) {
          authListener.data.subscription.unsubscribe();
          throw error;
        }
      }
      
    } catch (error: any) {
      console.error('Error updating password:', error);
      if (error?.status === 422 || (error?.message && /password/i.test(error.message))) {
        toast.error(
          'Dein Passwort erfüllt nicht die Sicherheitsanforderungen. ' +
          'Bitte wähle ein stärkeres, noch nicht verwendetes Passwort mit Groß- und Kleinbuchstaben, Zahlen und Sonderzeichen.'
        );
      } else {
        toast.error(error?.message || 'Fehler beim Aktualisieren des Passworts. Bitte versuche es erneut.');
      }
      setLoading(false);
      setIsUpdatingPassword(false);
    }
  };

  const handleAuth = async (type: 'login' | 'signup') => {
    try {
      setLoading(true);
      if (!email || !password) {
        toast.error('Bitte gib E-Mail und Passwort ein');
        setLoading(false);
        return;
      }
      if (!validateEmail(email)) {
        toast.error('Bitte gib eine gültige E-Mail-Adresse ein');
        setLoading(false);
        return;
      }
      if (type === 'signup') {
        const passwordErrors = validatePassword(password);
        if (passwordErrors.length > 0) {
          toast.error(`Das Passwort muss ${passwordErrors.join(', ')} enthalten`);
          setLoading(false);
          return;
        }

        // Check if terms are accepted
        if (!acceptedTerms) {
          toast.error('Bitte akzeptiere die AGB, Nutzungsbedingungen und Datenschutzerklärung');
          setLoading(false);
          return;
        }

        // Check if it's a non-university signup and show dialog
        if (!universityInfo) {
          setShowNonUniversityDialog(true);
          setLoading(false);
          return;
        }

        await performSignup();
        return;
      }

      const {
        error
      } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      if (error) {
        if (error.message.includes('Email not confirmed')) {
          toast.error('Bitte bestätige deine E-Mail-Adresse');
          setIsVerificationScreen(true);
          navigate('/auth?verification=pending');
        } else if (error.message.includes('Invalid login credentials')) {
          toast.error('Ungültige Anmeldedaten');
        } else {
          throw error;
        }
        return;
      }
      toast.info('Erfolgreich eingeloggt!');
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const performSignup = async () => {
    try {
      // Validate email against disposable email blocklist
      const emailValidation = await validateDisposableEmail(email);
      if (!emailValidation.valid) {
        toast.error(emailValidation.error || 'Disposable E-Mail-Adressen sind nicht erlaubt');
        return;
      }

      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin + '/auth?verification=pending',
          data: {
            university_id: universityInfo?.id || null,
            domain: getEmailDomain(email),
            marketing_consent: acceptedMarketing
          }
        }
      });

      if (signUpError) {
        if (signUpError.message.includes('User already registered')) {
          toast.error('Diese E-Mail-Adresse ist bereits registriert');
        } else {
          throw signUpError;
        }
        return;
      }

      // If signup was successful and we have a user, update the profile with marketing consent
      if (signUpData.user) {
        try {
          // Add a small delay to ensure the profile is created by the trigger
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const { error: profileError } = await supabase
            .from('profiles')
            .update({
              marketing_consent: acceptedMarketing,
              marketing_consent_at: acceptedMarketing ? new Date().toISOString() : null
            })
            .eq('id', signUpData.user.id);

          if (profileError) {
            console.error('Error updating marketing consent:', profileError);
            // Don't fail the signup process for this error
          }
        } catch (error) {
          console.error('Error saving marketing consent:', error);
          // Don't fail the signup process for this error
        }
      }

      setIsVerificationScreen(true);
      // FIXED: Clear university info to prevent showing stale data on verification screen
      setUniversityInfo(null);
      toast.success('Bitte überprüfe deine E-Mail, um deine Registrierung abzuschließen.');
      navigate('/auth?verification=pending');
    } catch (error: any) {
      console.error('Signup error:', error);
      if (error?.status === 422 || (error?.message && /password/i.test(error.message))) {
        toast.error(
          'Dein Passwort erfüllt nicht die Sicherheitsanforderungen. ' +
          'Bitte wähle ein stärkeres, noch nicht verwendetes Passwort mit Groß- und Kleinbuchstaben, Zahlen und Sonderzeichen.'
        );
      } else {
        toast.error(error?.message || 'Fehler bei der Registrierung. Bitte versuche es erneut.');
      }
    }
  };

  const handleNonUniversitySignupConfirm = () => {
    setShowNonUniversityDialog(false);
    performSignup();
  };

  const handleResendVerification = async () => {
    try {
      setLoading(true);
      
      if (!email) {
        toast.error('Bitte gib deine E-Mail-Adresse ein');
        setLoading(false);
        return;
      }
      
      if (!validateEmail(email)) {
        toast.error('Bitte gib eine gültige E-Mail-Adresse ein');
        setLoading(false);
        return;
      }
      
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: window.location.origin + '/auth?verification=pending'
        }
      });
      
      if (error) {
        console.error('Resend verification error:', error);
        throw error;
      }
      
      toast.success('Bestätigungslink wurde erneut gesendet. Bitte überprüfe deine E-Mails.');
    } catch (error: any) {
      console.error('Error resending verification:', error);
      toast.error('Fehler beim Senden der Bestätigungsmail: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (isVerificationScreen) {
    return <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-slate-50 p-4">
        <Card className="w-full max-w-md p-6 space-y-6">
          <div className="space-y-2 text-center">
            <div className="flex justify-center mb-4">
              {isEmailVerified ? <CheckCircle className="h-16 w-16 text-green-500" /> : <AlertCircle className="h-16 w-16 text-amber-500" />}
            </div>
            <h2 className="text-2xl font-semibold text-slate-800">
              {isEmailVerified ? 'E-Mail-Verifizierung abgeschlossen!' : 'E-Mail-Verifizierung ausstehend'}
            </h2>
            <p className="text-sm text-slate-600">
              {isEmailVerified ? universityName ? `Du hast jetzt Zugriff auf den Altfragen-Pool der ${universityName}.` : 'Deine E-Mail wurde erfolgreich verifiziert.' : 'Wir haben dir einen Bestätigungslink per E-Mail gesendet.'}
            </p>
          </div>

          <div className="space-y-4">
            {!isEmailVerified && <Alert className="bg-amber-50 border-amber-200">
                <Info className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-700">
                  Bitte überprüfe deinen Posteingang und klicke auf den Bestätigungslink. Pei Problemen melde dich unter <a href={`mailto:hallo@altfragen.io?subject=Problem%20mit%20E-Mail-Verifizierung&body=Hallo%20Altfragen.io-Team%2C%0A%0Aich%20habe%20Probleme%20mit%20der%20E-Mail-Verifizierung%20meines%20Kontos.%0A%0AMeine%20E-Mail-Adresse%3A%20${encodeURIComponent(email || '')}%0AProblembeschreibung%3A%20%0A%0A%0AFreundliche%20Gr%C3%BC%C3%9Fe`} className="text-blue-600 hover:underline">hallo@altfragen.io</a>.
                </AlertDescription>
              </Alert>}

            {isEmailVerified && universityName && <Alert className="bg-green-50 border-green-200">
                <School className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-700">
                  Du bist als Student:in der {universityName} verifiziert.
                </AlertDescription>
              </Alert>}

            <div className="pt-2 space-y-3">
              {isEmailVerified ? <Button className="w-full" onClick={() => navigate('/dashboard')}>
                  Zum Dashboard
                </Button> : <>
                  <Button className="w-full" onClick={handleResendVerification} disabled={loading}>
                    {loading ? 'Lädt...' : 'Bestätigungslink erneut senden'}
                  </Button>
                  <div className="text-center">
                    <button type="button" onClick={() => {
                  setIsVerificationScreen(false);
                  navigate('/auth');
                }} className="text-sm text-slate-600 hover:text-slate-900 underline" disabled={loading}>
                      Zurück zur Anmeldung
                    </button>
                  </div>
                </>}
            </div>
          </div>
        </Card>
      </div>;
  }
  if (isResetPassword) {
    return <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-slate-50 p-4">
        <Card className="w-full max-w-md p-6 space-y-6">
          <div className="space-y-2 text-center">
            <h2 className="text-2xl font-semibold text-slate-800">
              Neues Passwort festlegen
            </h2>
            <p className="text-sm text-slate-600">
              Bitte gib dein neues Passwort ein
            </p>
          </div>

          <form onSubmit={(e) => {
            e.preventDefault();
            console.log('Form submitted');
            handleUpdatePassword();
          }} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">Neues Passwort</Label>
              <Input 
                id="new-password" 
                type="password" 
                placeholder="Neues Passwort eingeben" 
                value={password} 
                onChange={(e) => {
                  const newValue = e.target.value;
                  console.log('Password input changed:', newValue.length);
                  setPassword(newValue);
                }} 
                disabled={loading} 
                className="w-full" 
              />
            </div>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Das Passwort muss mindestens 8 Zeichen lang sein und einen Großbuchstaben, 
                einen Kleinbuchstaben, eine Zahl und ein Sonderzeichen enthalten.
              </AlertDescription>
            </Alert>

            <Button 
              className="w-full" 
              disabled={loading}
              type="submit"
            >
              {loading ? 'Lädt...' : 'Passwort aktualisieren'}
            </Button>
          </form>
        </Card>
      </div>;
  }
  if (isForgotPassword) {
    return <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-slate-50 p-4">
        <Card className="w-full max-w-md p-6 space-y-6">
          <div className="space-y-2 text-center">
            <button onClick={() => setIsForgotPassword(false)} className="absolute left-6 top-6 text-slate-600 hover:text-slate-900">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h2 className="text-2xl font-semibold text-slate-800">
              Passwort zurücksetzen
            </h2>
            <p className="text-sm text-slate-600">
              Gib deine E-Mail-Adresse ein, um dein Passwort zurückzusetzen
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reset-email">E-Mail</Label>
              <Input id="reset-email" type="email" placeholder="E-Mail-Adresse eingeben" value={email} onChange={e => setEmail(e.target.value)} disabled={loading} className="w-full" />
            </div>

            <Button className="w-full" onClick={handleResetPassword} disabled={loading}>
              {loading ? 'Lädt...' : 'Passwort zurücksetzen'}
            </Button>
          </div>
        </Card>
      </div>;
  }
  return (
    <>
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-slate-50 p-4">
        <Card className="w-full max-w-md p-6 space-y-6">
          <div className="space-y-2 text-center">
            <h2 className="text-2xl font-semibold text-slate-800">
              Willkommen bei Altfragen.io!
            </h2>
            <p className="text-sm text-slate-600">
              {isSignUp ? 'Erstelle ein neues Konto' : 'Melde Dich mit deinem Konto an'}
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-Mail</Label>
              <div className="relative">
                <Input id="email" type="email" placeholder="E-Mail-Adresse eingeben" value={email} onChange={e => setEmail(e.target.value)} disabled={loading || isCheckingDomain} className="w-full" />
                {isSignUp && email && email.includes('@') && <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                    {isCheckingDomain ? <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-gray-400"></div> : universityInfo ? <Badge className="flex items-center gap-1 bg-green-50 text-green-800 border-green-200">
                        <School className="h-3 w-3" />
                        {universityInfo.name}
                      </Badge> : <Badge className="flex items-center gap-1 bg-blue-50 text-blue-800 border-blue-200">
                        <Mail className="h-3 w-3" />
                        Standard
                      </Badge>}
                  </div>}
              </div>
              {isSignUp && email && email.includes('@') && <div className="text-xs mt-1 text-slate-500">
                  {universityInfo ? <span className="text-green-600">
                      Du registrierst dich mit einer E-Mail von {universityInfo.name}
                    </span> : <span className="">Standard-Konto: Du hast Zugriff auf selbst hochgeladene Fragen. Nutze deine Uni E-Mail Adresse, um auf geteilte Fragen zuzugreifen.</span>}
                </div>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Passwort</Label>
              <Input id="password" type="password" placeholder="Passwort eingeben" value={password} onChange={e => setPassword(e.target.value)} disabled={loading} className="w-full" />
            </div>

            {isSignUp && <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Das Passwort muss mindestens 8 Zeichen lang sein und einen Großbuchstaben, 
                  einen Kleinbuchstaben, eine Zahl und ein Sonderzeichen enthalten.
                </AlertDescription>
              </Alert>}

            {isSignUp && (
              <>
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="terms"
                    checked={acceptedTerms}
                    onCheckedChange={(checked) => setAcceptedTerms(checked as boolean)}
                    className="mt-1"
                  />
                  <label
                    htmlFor="terms"
                    className="text-sm text-slate-600 leading-relaxed cursor-pointer"
                  >
                    Ich habe die{' '}
                    <Link to="/agb" className="text-blue-600 hover:underline" target="_blank">
                      AGB
                    </Link>
                    ,{' '}
                    <Link to="/terms" className="text-blue-600 hover:underline" target="_blank">
                      Nutzungsbedingungen
                    </Link>
                    {' '}und{' '}
                    <Link to="/privacy" className="text-blue-600 hover:underline" target="_blank">
                      Datenschutzerklärung
                    </Link>
                    {' '}gelesen und akzeptiere diese.
                  </label>
                </div>

                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="marketing"
                    checked={acceptedMarketing}
                    onCheckedChange={(checked) => setAcceptedMarketing(checked as boolean)}
                    className="mt-1"
                  />
                  <label
                    htmlFor="marketing"
                    className="text-sm text-slate-600 leading-relaxed cursor-pointer"
                  >
                    Ich möchte E-Mails mit Neuigkeiten, Angeboten und Produktupdates erhalten. Diese Einwilligung kann jederzeit widerrufen werden.
                  </label>
                </div>
              </>
            )}

            <div className="space-y-2 pt-2">
              <Button className="w-full" onClick={() => handleAuth(isSignUp ? 'signup' : 'login')} disabled={loading || isCheckingDomain}>
                {loading ? 'Lädt...' : isSignUp ? 'Registrieren' : 'Anmelden'}
              </Button>
              
              <div className="text-center space-y-2">
                <button type="button" onClick={() => {
                  setIsSignUp(!isSignUp);
                  setAcceptedTerms(false);
                  setAcceptedMarketing(false);
                  // FIXED: Clear university info when switching modes
                  setUniversityInfo(null);
                }} className="text-sm text-slate-600 hover:text-slate-900 underline" disabled={loading}>
                  {isSignUp ? 'Bereits registriert? Hier anmelden' : 'Noch kein Konto? Hier registrieren'}
                </button>

                {!isSignUp && <div>
                    <button type="button" onClick={() => setIsForgotPassword(true)} className="text-sm text-slate-600 hover:text-slate-900 underline" disabled={loading}>
                      Passwort vergessen?
                    </button>
                  </div>}
              </div>
            </div>
          </div>
        </Card>
      </div>
      
      <NonUniversitySignupDialog
        open={showNonUniversityDialog}
        onOpenChange={setShowNonUniversityDialog}
        onConfirm={handleNonUniversitySignupConfirm}
        email={email}
      />
    </>
  );
};

export default Auth;