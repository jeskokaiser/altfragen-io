
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

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [isResetPassword, setIsResetPassword] = useState(false);
  const [universityInfo, setUniversityInfo] = useState<{ id: string, name: string } | null>(null);
  const [isCheckingDomain, setIsCheckingDomain] = useState(false);
  const [isVerificationScreen, setIsVerificationScreen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isEmailVerified, universityName } = useAuth();

  useEffect(() => {
    // Check for verification screen flag in URL
    const params = new URLSearchParams(location.search);
    if (params.get('verification') === 'pending') {
      setIsVerificationScreen(true);
    }

    // Check for recovery mode and access token in URL parameters
    const type = params.get('type');
    const access_token = params.get('access_token');
    const refresh_token = params.get('refresh_token');
    
    if (type === 'recovery' && (access_token || refresh_token)) {
      // Set the session using the tokens
      supabase.auth.setSession({
        access_token: access_token || '',
        refresh_token: refresh_token || ''
      }).then(({ data, error }) => {
        if (error) {
          toast.error('Fehler beim Zurücksetzen des Passworts. Bitte versuchen Sie es erneut.');
          navigate('/auth');
        } else if (data.session) {
          setIsResetPassword(true);
        }
      });
    }
    
    // Check for email verification
    if (type === 'email_change' || type === 'signup') {
      // Handle email verification redirect
      handleEmailVerification();
    }
  }, [location, navigate]);

  // Handle email verification
  const handleEmailVerification = async () => {
    try {
      setLoading(true);
      
      // Get current session
      const { data: sessionData } = await supabase.auth.getSession();
      
      if (sessionData.session) {
        // User is signed in and verified
        toast.success('E-Mail wurde erfolgreich bestätigt!');
        
        // Ensure profile is updated with verification status
        const userId = sessionData.session.user.id;
        await updateVerificationStatus(userId, true);
        
        navigate('/dashboard');
      } else {
        // No session yet, user probably clicked verification link without being logged in
        // Show verification success message and login form
        toast.success('E-Mail wurde bestätigt. Bitte melden Sie sich an.');
        navigate('/auth');
      }
    } catch (error: any) {
      console.error('Email verification error:', error);
      toast.error('Fehler bei der E-Mail-Bestätigung: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Update verification status in profiles table
  const updateVerificationStatus = async (userId: string, isVerified: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_email_verified: isVerified })
        .eq('id', userId);
        
      if (error) {
        console.error('Error updating verification status:', error);
      }
    } catch (error) {
      console.error('Error in updateVerificationStatus:', error);
    }
  };

  // Check email domain against universities table
  useEffect(() => {
    const checkEmailDomain = async () => {
      if (!email || !email.includes('@') || !isSignUp) return;
      
      try {
        setIsCheckingDomain(true);
        const emailDomain = email.split('@')[1];
        
        if (!emailDomain) return;
        
        const { data, error } = await supabase
          .from('universities')
          .select('id, name')
          .eq('email_domain', emailDomain)
          .single();
        
        if (error) {
          if (error.code !== 'PGRST116') { // PGRST116 is the error code for "no rows returned"
            console.error('Error checking university domain:', error);
          }
          setUniversityInfo(null);
        } else if (data) {
          setUniversityInfo({ id: data.id, name: data.name });
        }
      } catch (error) {
        console.error('Error in checkEmailDomain:', error);
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
    
    const errors = [];
    if (password.length < minLength) errors.push(`mindestens ${minLength} Zeichen`);
    if (!hasUpperCase) errors.push('einen Großbuchstaben');
    if (!hasLowerCase) errors.push('einen Kleinbuchstaben');
    if (!hasNumbers) errors.push('eine Zahl');
    
    return errors;
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const getEmailDomain = (email: string) => {
    return email.split('@')[1] || '';
  };

  const handleResetPassword = async () => {
    try {
      setLoading(true);
      
      if (!email) {
        toast.error('Bitte geben Sie Ihre E-Mail-Adresse ein');
        return;
      }

      if (!validateEmail(email)) {
        toast.error('Bitte geben Sie eine gültige E-Mail-Adresse ein');
        return;
      }

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/auth?type=recovery',
      });

      if (error) {
        throw error;
      }

      toast.success('Eine E-Mail zum Zurücksetzen des Passworts wurde gesendet');
      setIsForgotPassword(false);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    try {
      setLoading(true);

      if (!password) {
        toast.error('Bitte geben Sie ein neues Passwort ein');
        return;
      }

      const passwordErrors = validatePassword(password);
      if (passwordErrors.length > 0) {
        toast.error(`Das Passwort muss ${passwordErrors.join(', ')} enthalten`);
        return;
      }

      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        throw error;
      }

      toast.success('Passwort erfolgreich aktualisiert');
      
      // After successful password update, sign out the user and redirect to login
      await supabase.auth.signOut();
      setIsResetPassword(false);
      navigate('/auth');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async (type: 'login' | 'signup') => {
    try {
      setLoading(true);
      
      if (!email || !password) {
        toast.error('Bitte geben Sie E-Mail und Passwort ein');
        return;
      }

      if (!validateEmail(email)) {
        toast.error('Bitte geben Sie eine gültige E-Mail-Adresse ein');
        return;
      }

      if (type === 'signup') {
        const passwordErrors = validatePassword(password);
        if (passwordErrors.length > 0) {
          toast.error(`Das Passwort muss ${passwordErrors.join(', ')} enthalten`);
          return;
        }

        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin + '/auth?verification=pending',
            data: {
              university_id: universityInfo?.id || null,
              domain: getEmailDomain(email),
            },
          },
        });

        if (signUpError) {
          if (signUpError.message.includes('User already registered')) {
            toast.error('Diese E-Mail-Adresse ist bereits registriert');
          } else {
            throw signUpError;
          }
          return;
        }

        // After successful signup, redirect to verification pending screen
        setIsVerificationScreen(true);
        toast.success('Bitte überprüfen Sie Ihre E-Mail, um Ihre Registrierung abzuschließen.');
        navigate('/auth?verification=pending');
        return;
      }

      // Handle login
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes('Email not confirmed')) {
          toast.error('Bitte bestätigen Sie Ihre E-Mail-Adresse');
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

  const handleResendVerification = async () => {
    try {
      setLoading(true);
      
      if (!email) {
        toast.error('Bitte geben Sie Ihre E-Mail-Adresse ein');
        return;
      }

      if (!validateEmail(email)) {
        toast.error('Bitte geben Sie eine gültige E-Mail-Adresse ein');
        return;
      }

      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: window.location.origin + '/auth?verification=pending',
        },
      });

      if (error) {
        throw error;
      }

      toast.success('Bestätigungslink wurde erneut gesendet. Bitte überprüfen Sie Ihre E-Mails.');
    } catch (error: any) {
      toast.error('Fehler beim Senden der Bestätigungsmail: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (isVerificationScreen) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-slate-50 p-4">
        <Card className="w-full max-w-md p-6 space-y-6">
          <div className="space-y-2 text-center">
            <div className="flex justify-center mb-4">
              {isEmailVerified ? (
                <CheckCircle className="h-16 w-16 text-green-500" />
              ) : (
                <AlertCircle className="h-16 w-16 text-amber-500" />
              )}
            </div>
            <h2 className="text-2xl font-semibold text-slate-800">
              {isEmailVerified 
                ? 'E-Mail-Verifizierung abgeschlossen!' 
                : 'E-Mail-Verifizierung ausstehend'}
            </h2>
            <p className="text-sm text-slate-600">
              {isEmailVerified
                ? universityName 
                  ? `Sie haben jetzt Zugriff auf den Altfragen-Pool der ${universityName}.` 
                  : 'Ihre E-Mail wurde erfolgreich verifiziert.'
                : 'Wir haben Ihnen einen Bestätigungslink per E-Mail gesendet.'}
            </p>
          </div>

          <div className="space-y-4">
            {!isEmailVerified && (
              <Alert className="bg-amber-50 border-amber-200">
                <Info className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-700">
                  Bitte überprüfen Sie Ihren Posteingang und klicken Sie auf den Bestätigungslink.
                </AlertDescription>
              </Alert>
            )}

            {isEmailVerified && universityName && (
              <Alert className="bg-green-50 border-green-200">
                <School className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-700">
                  Sie sind als Student der {universityName} verifiziert.
                </AlertDescription>
              </Alert>
            )}

            <div className="pt-2 space-y-3">
              {isEmailVerified ? (
                <Button 
                  className="w-full" 
                  onClick={() => navigate('/dashboard')}
                >
                  Zum Dashboard
                </Button>
              ) : (
                <>
                  <Button 
                    className="w-full" 
                    onClick={handleResendVerification}
                    disabled={loading}
                  >
                    {loading ? 'Lädt...' : 'Bestätigungslink erneut senden'}
                  </Button>
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => {
                        setIsVerificationScreen(false);
                        navigate('/auth');
                      }}
                      className="text-sm text-slate-600 hover:text-slate-900 underline"
                      disabled={loading}
                    >
                      Zurück zur Anmeldung
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (isResetPassword) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-slate-50 p-4">
        <Card className="w-full max-w-md p-6 space-y-6">
          <div className="space-y-2 text-center">
            <h2 className="text-2xl font-semibold text-slate-800">
              Neues Passwort festlegen
            </h2>
            <p className="text-sm text-slate-600">
              Bitte geben Sie Ihr neues Passwort ein
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">Neues Passwort</Label>
              <Input
                id="new-password"
                type="password"
                placeholder="Neues Passwort eingeben"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="w-full"
              />
            </div>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Das Passwort muss mindestens 8 Zeichen lang sein und einen Großbuchstaben, 
                einen Kleinbuchstaben und eine Zahl enthalten.
              </AlertDescription>
            </Alert>

            <Button 
              className="w-full" 
              onClick={handleUpdatePassword}
              disabled={loading}
            >
              {loading ? 'Lädt...' : 'Passwort aktualisieren'}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (isForgotPassword) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-slate-50 p-4">
        <Card className="w-full max-w-md p-6 space-y-6">
          <div className="space-y-2 text-center">
            <button
              onClick={() => setIsForgotPassword(false)}
              className="absolute left-6 top-6 text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h2 className="text-2xl font-semibold text-slate-800">
              Passwort zurücksetzen
            </h2>
            <p className="text-sm text-slate-600">
              Geben Sie Ihre E-Mail-Adresse ein, um Ihr Passwort zurückzusetzen
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reset-email">E-Mail</Label>
              <Input
                id="reset-email"
                type="email"
                placeholder="E-Mail-Adresse eingeben"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="w-full"
              />
            </div>

            <Button 
              className="w-full" 
              onClick={handleResetPassword}
              disabled={loading}
            >
              {loading ? 'Lädt...' : 'Passwort zurücksetzen'}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md p-6 space-y-6">
        <div className="space-y-2 text-center">
          <h2 className="text-2xl font-semibold text-slate-800">
            Willkommen bei Altfragen.io!
          </h2>
          <p className="text-sm text-slate-600">
            {isSignUp 
              ? 'Erstelle ein neues Konto' 
              : 'Melde Dich mit deinem Konto an'}
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">E-Mail</Label>
            <div className="relative">
              <Input
                id="email"
                type="email"
                placeholder="E-Mail-Adresse eingeben"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading || isCheckingDomain}
                className="w-full"
              />
              {isSignUp && email && email.includes('@') && (
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                  {isCheckingDomain ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-gray-400"></div>
                  ) : universityInfo ? (
                    <Badge variant="outline" className="flex items-center gap-1 bg-green-50 text-green-800 border-green-200">
                      <School className="h-3 w-3" />
                      {universityInfo.name}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="flex items-center gap-1 bg-blue-50 text-blue-800 border-blue-200">
                      <Mail className="h-3 w-3" />
                      Standard
                    </Badge>
                  )}
                </div>
              )}
            </div>
            {isSignUp && email && email.includes('@') && (
              <div className="text-xs mt-1 text-slate-500">
                {universityInfo ? (
                  <span className="text-green-600">
                    Du registrierst dich mit einer E-Mail von {universityInfo.name}
                  </span>
                ) : (
                  <span>
                    Standard-Konto: Du hast Zugriff auf deine eigenen Fragen
                  </span>
                )}
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">Passwort</Label>
            <Input
              id="password"
              type="password"
              placeholder="Passwort eingeben"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              className="w-full"
            />
          </div>

          {isSignUp && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Das Passwort muss mindestens 8 Zeichen lang sein und einen Großbuchstaben, 
                einen Kleinbuchstaben und eine Zahl enthalten.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2 pt-2">
            <Button 
              className="w-full" 
              onClick={() => handleAuth(isSignUp ? 'signup' : 'login')}
              disabled={loading || isCheckingDomain}
            >
              {loading ? 'Lädt...' : (isSignUp ? 'Registrieren' : 'Anmelden')}
            </Button>
            
            <div className="text-center space-y-2">
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-sm text-slate-600 hover:text-slate-900 underline"
                disabled={loading}
              >
                {isSignUp 
                  ? 'Bereits registriert? Hier anmelden' 
                  : 'Noch kein Konto? Hier registrieren'}
              </button>

              {!isSignUp && (
                <div>
                  <button
                    type="button"
                    onClick={() => setIsForgotPassword(true)}
                    className="text-sm text-slate-600 hover:text-slate-900 underline"
                    disabled={loading}
                  >
                    Passwort vergessen?
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Auth;
