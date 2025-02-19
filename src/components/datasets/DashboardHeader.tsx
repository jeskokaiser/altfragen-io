import React from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Moon, Sun, BookOpen } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useIsMobile } from '@/hooks/use-mobile';
const DashboardHeader: React.FC = () => {
  const navigate = useNavigate();
  const {
    theme,
    toggleTheme
  } = useTheme();
  const isMobile = useIsMobile();
  const handleSignOutAndNavigate = async () => {
    const {
      error
    } = await supabase.auth.signOut();
    if (error) {
      console.error('Fehler beim Abmelden:', error);
      return;
    }
    navigate('/');
  };
  return <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-2">
      <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-zinc-50">Dashboard</h1>
     
    </div>;
};
export default DashboardHeader;