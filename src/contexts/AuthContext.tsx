import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { fetchUserProfile as fetchProfile, setEmailVerified } from '@/services/ProfileService';
import { fetchUniversityName } from '@/services/UniversityService';
import { User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  universityId: string | null;
  isEmailVerified: boolean;
  universityName: string | null;
  username: string | null;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  universityId: null,
  isEmailVerified: false,
  universityName: null,
  username: null,
  logout: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [universityId, setUniversityId] = useState<string | null>(null);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [universityName, setUniversityName] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

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
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.id);
      setUser(session?.user ?? null);

      // REMOVED: Don't update verification status on USER_UPDATED - let the profile table be the source of truth

      if (session?.user) {
        fetchUserProfile(session.user.id);
      } else {
        setUniversityId(null);
        setIsEmailVerified(false);
        setUniversityName(null);
        setUsername(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const updateEmailVerificationStatus = async (userId: string, isVerified: boolean) => {
    try {
      await setEmailVerified(userId, isVerified);
    } catch (error) {
      console.error('Error updating email verification status:', error);
    }
  };

  const fetchUserProfile = async (userId: string) => {
    try {
      const profile = await fetchProfile(userId);

      // Smart sync: auth holds the authoritative answer, so only write back when
      // auth says verified and the profile has not caught up.
      const { data: authData } = await supabase.auth.getUser();
      const isConfirmedInAuth = authData?.user?.email_confirmed_at !== null;

      if (isConfirmedInAuth && !profile.isEmailVerified) {
        await updateEmailVerificationStatus(userId, true);
        setIsEmailVerified(true);
      } else {
        setIsEmailVerified(profile.isEmailVerified);
      }

      setUniversityId(profile.universityId);

      if (profile.universityId) {
        // A failure here must not cost the rest of the profile, so it is caught
        // separately: the user keeps their university, just not its name.
        try {
          setUniversityName(await fetchUniversityName(profile.universityId));
        } catch (error) {
          console.error('Error fetching university:', error);
        }
      } else {
        setUniversityName(null);
      }

      setUsername(profile.username);
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        universityId,
        isEmailVerified,
        universityName,
        username,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
