
import { useAuth } from '@/contexts/AuthContext';

/**
 * Custom hook for handling logout functionality
 * @returns logout function from AuthContext
 */
export const useLogout = () => {
  const { logout } = useAuth();
  
  return { logout };
};
