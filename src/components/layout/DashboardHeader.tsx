
import React from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/contexts/ThemeContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { useLogout } from '@/hooks/use-logout';

const DashboardHeader: React.FC = () => {
  const navigate = useNavigate();
  const { logout } = useLogout();
  const { theme, toggleTheme } = useTheme();
  const isMobile = useIsMobile();
  
  const handleSignOutAndNavigate = async () => {
    const { error } = await logout();
    if (error) {
      console.error('Fehler beim Abmelden:', error);
      return;
    }
    navigate('/');
  };
  
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-2">
      <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-zinc-50">Dashboard</h1>
    </div>
  );
};

export default DashboardHeader;
