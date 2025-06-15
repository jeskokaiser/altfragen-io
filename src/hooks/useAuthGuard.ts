
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface AuthGuardState {
  isReady: boolean;
  isAuthenticated: boolean;
  userId: string | null;
}

export const useAuthGuard = (): AuthGuardState => {
  const { user, loading } = useAuth();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Only mark as ready when auth loading is complete
    if (!loading) {
      // Add a small delay to ensure auth state is fully stable
      const timer = setTimeout(() => {
        setIsReady(true);
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [loading]);

  const isDemoSession = localStorage.getItem('isDemoSession') === 'true';

  return {
    isReady,
    isAuthenticated: (!!user && isReady) || isDemoSession,
    userId: user?.id || null
  };
};

