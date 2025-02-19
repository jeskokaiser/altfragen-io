
import React from 'react';
import { Link } from 'react-router-dom';
import { Settings, LogOut, Moon, Sun, BookOpen } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';

const Header = () => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/auth');
      toast.success('Successfully logged out');
    } catch (error) {
      toast.error('Error logging out');
    }
  };

  const getUserInitials = () => {
    if (!user?.email) return '?';
    return user.email
      .split('@')[0]
      .slice(0, 2)
      .toUpperCase();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between px-4 md:px-6">
        {/* Left section - Logo/Brand */}
        <Link to="/dashboard" className="flex items-center space-x-2">
          <span className="text-lg font-semibold tracking-tight hover:text-primary transition-colors">
            Altfragen.io
          </span>
        </Link>

        {/* Right section - Action Buttons and Profile Menu */}
        <div className="flex items-center gap-2 md:gap-4">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/tutorial')} 
            size={isMobile ? "icon" : "default"}
            className="hidden sm:flex items-center gap-2"
          >
            <BookOpen className="h-4 w-4" />
            {!isMobile && "Tutorial"}
          </Button>

          <Button 
            variant="ghost" 
            onClick={toggleTheme} 
            size={isMobile ? "icon" : "default"}
            className="hidden sm:flex items-center gap-2"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            {!isMobile && "Anzeigemodus"}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-8 w-8 rounded-full"
                aria-label="User menu"
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback>{getUserInitials()}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <div className="flex items-center justify-start gap-2 p-2">
                <div className="flex flex-col space-y-1 leading-none">
                  {user?.email && (
                    <p className="font-medium text-sm">{user.email}</p>
                  )}
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link 
                  to="/settings"
                  className="flex w-full cursor-pointer items-center"
                >
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Einstellungen</span>
                </Link>
              </DropdownMenuItem>
              {isMobile && (
                <>
                  <DropdownMenuItem onClick={() => navigate('/tutorial')}>
                    <BookOpen className="mr-2 h-4 w-4" />
                    <span>Tutorial</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={toggleTheme}>
                    {theme === 'dark' ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
                    <span>Anzeigemodus</span>
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuItem
                className="cursor-pointer text-red-600 focus:text-red-600"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Abmelden</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default Header;
