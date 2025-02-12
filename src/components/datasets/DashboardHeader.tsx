
import React from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Moon, Sun, BookOpen } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

const DashboardHeader: React.FC = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const handleSignOutAndNavigate = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Fehler beim Abmelden:', error);
      return;
    }
    navigate('/');
  };

  return (
    <div className="flex justify-between items-center">
      <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Dashboard</h1>
      <div className="flex items-center gap-2">
        <Button 
          variant="outline"
          onClick={() => navigate('/tutorial')}
          className="gap-2"
        >
          <BookOpen className="h-4 w-4" />
          Tutorial
        </Button>
        <Button 
          variant="outline" 
          size="icon"
          onClick={toggleTheme}
          className="h-10 w-10"
        >
          {theme === 'dark' ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}Anzeigemodus
        </Button>
        <Button onClick={handleSignOutAndNavigate}>Abmelden</Button>
      </div>
    </div>
  );
};

export default DashboardHeader;
