
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import LoadingFallback from '@/components/common/LoadingFallback';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingFallback message="Überprüfe Authentifizierung..." />;
  }

  if (!user) {
    // Save the intended destination for redirect after login
    const redirectPath = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/auth?redirect=${redirectPath}`} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
