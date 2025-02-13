
import React from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Moon, Sun, BookOpen } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useIsMobile } from '@/hooks/use-mobile';

const DashboardHeader: React.FC = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const isMobile = useIsMobile();

  const handleSignOutAndNavigate = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Fehler beim Abmelden:', error);
      return;
    }
    navigate('/');
  };

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-2">
      <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-100">Dashboard</h1>
      <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
        <Button 
          variant="outline"
          onClick={() => navigate('/tutorial')}
          className="gap-2 flex-1 sm:flex-none text-sm"
          size={isMobile ? "sm" : "default"}
        >
          <BookOpen className="h-4 w-4" />
          {!isMobile && "Tutorial"}
        </Button>
        <Button 
          variant="outline" 
          onClick={toggleTheme}
          className="gap-2 flex-1 sm:flex-none text-sm"
          size={isMobile ? "sm" : "default"}
        >
          {theme === 'dark' ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
          {!isMobile && "Anzeigemodus"}
        </Button>
        <Button 
          onClick={handleSignOutAndNavigate}
          className="flex-1 sm:flex-none text-sm"
          size={isMobile ? "sm" : "default"}
        >
          Abmelden
        </Button>
      </div>
    </div>
  );
};

export default DashboardHeader;
