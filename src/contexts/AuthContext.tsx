
import { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { AuthContextType } from '@/types/contexts/AuthContextType';
import { logError } from '@/utils/errorHandler';

/**
 * Context for managing authentication state throughout the application
 */
const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

/**
 * Provider component for the authentication context
 * 
 * @param children - The child components to be wrapped by the provider
 * @returns Auth provider component
 * 
 * @example
 * ```tsx
 * <AuthProvider>
 *   <App />
 * </AuthProvider>
 * ```
 */
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

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
    error
  }), [user, loading, error]);

  // Show a loading indicator while initializing
  if (loading && !user) {
    console.log('Auth is still loading...');
  }

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
 * 
 * @example
 * ```tsx
 * const { user, loading } = useAuth();
 * 
 * if (loading) return <Loading />;
 * if (!user) return <LoginForm />;
 * ```
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    console.warn('useAuth must be used within an AuthProvider');
  }
  return context;
};
