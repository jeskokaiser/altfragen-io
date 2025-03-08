
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import LoadingFallback from '@/components/common/LoadingFallback';

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectPath?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  redirectPath = '/auth'
}) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingFallback message="Überprüfe Authentifizierung..." />;
  }

  if (!user) {
    // Save the intended destination for redirect after login
    const redirectPathWithQuery = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`${redirectPath}?redirect=${redirectPathWithQuery}`} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
