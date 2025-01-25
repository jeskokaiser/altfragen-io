import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { Label } from '@/components/ui/label';

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleAuth = async (type: 'login' | 'signup') => {
    try {
      setLoading(true);
      
      if (!email || !password) {
        toast.error('Bitte geben Sie E-Mail und Passwort ein');
        return;
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
        throw error;
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
        <h2 className="text-2xl font-semibold text-center text-slate-800">Willkommen bei Altfragen.io</h2>
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
            />
          </div>
          <div className="space-y-2 pt-2">
            <Button 
              className="w-full" 
              onClick={() => handleAuth('login')}
              disabled={loading}
            >
              {loading ? 'Lädt...' : 'Anmelden'}
            </Button>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => handleAuth('signup')}
              disabled={loading}
            >
              Registrieren
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Auth;