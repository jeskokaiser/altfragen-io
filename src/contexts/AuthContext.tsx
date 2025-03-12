
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  universityId: string | null;
  isEmailVerified: boolean;
  universityName: string | null;
}

const AuthContext = createContext<AuthContextType>({ 
  user: null, 
  loading: true, 
  universityId: null,
  isEmailVerified: false,
  universityName: null
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [universityId, setUniversityId] = useState<string | null>(null);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [universityName, setUniversityName] = useState<string | null>(null);

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for changes on auth state (sign in, sign out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserProfile(session.user.id);
      } else {
        setUniversityId(null);
        setIsEmailVerified(false);
        setUniversityName(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      // Fetch user profile information
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('university_id, is_email_verified')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        setLoading(false);
        return;
      }

      setIsEmailVerified(profileData.is_email_verified || false);
      
      if (profileData.university_id) {
        setUniversityId(profileData.university_id);
        
        // Fetch university name if university_id exists
        const { data: universityData, error: universityError } = await supabase
          .from('universities')
          .select('name')
          .eq('id', profileData.university_id)
          .single();
        
        if (universityError) {
          console.error('Error fetching university:', universityError);
        } else {
          setUniversityName(universityData.name);
        }
      } else {
        setUniversityId(null);
        setUniversityName(null);
      }
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      universityId, 
      isEmailVerified, 
      universityName
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
