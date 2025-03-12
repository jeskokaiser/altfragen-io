
import { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { AuthContextType } from '@/types/contexts/AuthContextType';
import { logError } from '@/utils/errorHandler';
import { toast } from 'sonner';
import { UserProfile } from '@/types/models/UserProfile';
import { fetchUserProfile } from '@/services/ProfileService';
import { getUniversityByEmailDomain } from '@/services/UniversityService';

/**
 * Context for managing authentication state throughout the application
 */
const AuthContext = createContext<AuthContextType>({ 
  user: null, 
  profile: null,
  loading: true,
  error: null,
  logout: async () => ({ error: null }),
  verifyUniversityEmail: async () => ({ success: false })
});

/**
 * Provider component for the authentication context
 * 
 * @param children - The child components to be wrapped by the provider
 * @returns Auth provider component
 */
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadUserProfile = async (userId: string) => {
    try {
      const userProfile = await fetchUserProfile();
      setProfile(userProfile);
    } catch (err) {
      console.error("Error loading user profile:", err);
    }
  };

  // Verify university email and update profile
  const verifyUniversityEmail = async (): Promise<{ success: boolean, message?: string }> => {
    try {
      if (!user || !user.email) {
        return { success: false, message: 'User not authenticated or email not available' };
      }

      // Extract domain from email
      const emailDomain = user.email.split('@')[1];
      const university = await getUniversityByEmailDomain(emailDomain);

      if (!university) {
        return { 
          success: false, 
          message: `Your email domain (${emailDomain}) is not associated with any registered university` 
        };
      }

      // Update user profile with university information
      const { data: updatedProfile, error: updateError } = await supabase
        .from('profiles')
        .update({
          university_id: university.id,
          is_email_verified: true
        })
        .eq('id', user.id)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      // Update the profile in state
      setProfile(updatedProfile);
      
      toast.success(`Your email has been verified for ${university.name}`);
      return { 
        success: true, 
        message: `You've been verified as a member of ${university.name}` 
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      toast.error('Failed to verify university email');
      logError(err, { component: 'AuthContext', function: 'verifyUniversityEmail' });
      return { success: false, message: errorMessage };
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw error;
      }
      
      setProfile(null);
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
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          throw sessionError;
        }
        
        setUser(session?.user ?? null);
        
        // Load user profile if signed in
        if (session?.user) {
          await loadUserProfile(session.user.id);
        }
        
        // Listen for changes on auth state (sign in, sign out, etc.)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
          setUser(session?.user ?? null);
          
          // Load or clear profile based on auth state
          if (session?.user) {
            await loadUserProfile(session.user.id);
          } else {
            setProfile(null);
          }
          
          setLoading(false);
        });
        
        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
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
    profile,
    loading,
    error,
    logout,
    verifyUniversityEmail
  }), [user, profile, loading, error]);

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
