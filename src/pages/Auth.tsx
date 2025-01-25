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
        toast.error('Please enter both email and password');
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
        toast.success('Successfully logged in!');
        navigate('/');
      } else {
        toast.success('Check your email for the confirmation link!');
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
        <h2 className="text-2xl font-semibold text-center text-slate-800">Welcome to CSV Query Pal</h2>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
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
              {loading ? 'Loading...' : 'Sign In'}
            </Button>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => handleAuth('signup')}
              disabled={loading}
            >
              Sign Up
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Auth;