
import { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { AuthContextType } from '@/types/contexts/AuthContextType';
import { logError } from '@/utils/errorHandler';
import { toast } from 'sonner';

/**
 * Context for managing authentication state throughout the application
 */
const AuthContext = createContext<AuthContextType>({ 
  user: null, 
  loading: true,
  error: null,
  logout: async () => ({ error: null }) 
});

/**
 * Provider component for the authentication context
 * 
 * @param children - The child components to be wrapped by the provider
 * @returns Auth provider component
 */
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const logout = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw error;
      }
      
      toast.success('Erfolgreich abgemeldet');
      return { error: null };
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Ein unbekannter Fehler ist aufgetreten');
      toast.error('Fehler beim Abmelden');
      return { error };
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check active sessions and sets the user
    const initAuth = async () => {
      setLoading(true);
      try {
        console.log('Initializing auth...');
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          throw sessionError;
        }
        
        setUser(session?.user ?? null);
        console.log('Session user:', session?.user ? `${session.user.email} (${session.user.id})` : 'No active session');
        
        // Listen for changes on auth state (sign in, sign out, etc.)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          console.log('Auth state changed:', event);
          setUser(session?.user ?? null);
          setLoading(false);
        });
        
        return () => {
          console.log('Cleaning up auth subscription');
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error('Error initializing auth:', error);
        setError(error instanceof Error ? error : new Error('Unknown auth error'));
        logError(error, { component: 'AuthProvider', function: 'initAuth' });
      } finally {
        setLoading(false);
      }
    };
    
    initAuth();
  }, []);

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    user,
    loading,
    error,
    logout
  }), [user, loading, error]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Hook to access the authentication context
 * 
 * @returns The authentication context
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    console.warn('useAuth must be used within an AuthProvider');
  }
  return context;
};
