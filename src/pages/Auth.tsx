
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info, ArrowLeft } from "lucide-react";

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [isResetPassword, setIsResetPassword] = useState(false);
  const [universityName, setUniversityName] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Check for recovery mode and access token in URL parameters
    const params = new URLSearchParams(window.location.search);
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
  }, [navigate]);

  // Check if email belongs to a university
  const checkUniversityDomain = async (email: string) => {
    if (!email || !email.includes('@')) return null;
    
    const domain = email.split('@')[1];
    
    try {
      const { data, error } = await supabase
        .from('universities')
        .select('name')
        .eq('email_domain', domain)
        .single();
      
      if (error) {
        console.error('Error checking university domain:', error);
        return null;
      }
      
      return data?.name || null;
    } catch (error) {
      console.error('Error checking university domain:', error);
      return null;
    }
  };

  // Check university domain when email changes
  useEffect(() => {
    if (isSignUp && email) {
      const checkDomain = async () => {
        const name = await checkUniversityDomain(email);
        setUniversityName(name);
      };
      
      checkDomain();
    }
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

        // Check university email domain during signup
        const universityName = await checkUniversityDomain(email);
        
        if (!universityName) {
          toast.error('Diese E-Mail-Domain gehört zu keiner registrierten Universität');
          return;
        }

        const { error: signUpError, data } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: {
              email_domain: email.split('@')[1],
            }
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

        toast.success('Registrierung erfolgreich! Bitte bestätigen Sie Ihre E-Mail-Adresse.');
        toast.info(`Sie werden der Universität "${universityName}" zugeordnet, sobald Sie Ihre E-Mail bestätigt haben.`);
        setIsSignUp(false);
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes('Email not confirmed')) {
          toast.error('Bitte bestätigen Sie Ihre E-Mail-Adresse');
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
            <Input
              id="email"
              type="email"
              placeholder="E-Mail-Adresse eingeben"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              className="w-full"
            />
            {isSignUp && (
              <div className="text-sm mt-1">
                {universityName ? (
                  <span className="text-green-600">✓ Erkannt: {universityName}</span>
                ) : email && email.includes('@') ? (
                  <span className="text-red-600">✗ Keine Universitäts-Domain erkannt</span>
                ) : null}
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
                <p>Das Passwort muss mindestens 8 Zeichen lang sein und einen Großbuchstaben, 
                einen Kleinbuchstaben und eine Zahl enthalten.</p>
                <p className="mt-1">
                  Bitte verwenden Sie Ihre Universitäts-E-Mail-Adresse für die Registrierung.
                </p>
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2 pt-2">
            <Button 
              className="w-full" 
              onClick={() => handleAuth(isSignUp ? 'signup' : 'login')}
              disabled={loading}
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
