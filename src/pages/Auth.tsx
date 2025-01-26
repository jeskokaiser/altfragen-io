import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const navigate = useNavigate();

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
      }

      const { error } = type === 'login'
        ? await supabase.auth.signInWithPassword({
            email,
            password,
          })
        : await supabase.auth.signUp({
            email,
            password,
            options: {
              emailRedirectTo: window.location.origin,
            },
          });

      if (error) {
        if (error.message.includes('Email not confirmed')) {
          toast.error('Bitte bestätigen Sie Ihre E-Mail-Adresse');
        } else if (error.message.includes('Invalid login credentials')) {
          toast.error('Ungültige Anmeldedaten');
        } else if (error.message.includes('User already registered')) {
          toast.error('Diese E-Mail-Adresse ist bereits registriert');
        } else {
          throw error;
        }
        return;
      }
      
      if (type === 'login') {
        toast.success('Erfolgreich eingeloggt!');
        navigate('/');
      } else {
        toast.success('Überprüfen Sie Ihre E-Mail für den Bestätigungslink!');
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md p-6 space-y-6">
        <div className="space-y-2 text-center">
          <h2 className="text-2xl font-semibold text-slate-800">
            Willkommen bei Altfragen.io
          </h2>
          <p className="text-sm text-slate-600">
            {isSignUp 
              ? 'Erstellen Sie ein neues Konto' 
              : 'Melden Sie sich mit Ihrem Konto an'}
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
              disabled={loading}
            >
              {loading ? 'Lädt...' : (isSignUp ? 'Registrieren' : 'Anmelden')}
            </Button>
            
            <div className="text-center">
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
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Auth;