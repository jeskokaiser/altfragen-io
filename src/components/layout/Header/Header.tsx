
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Menu, X, LogOut, User, Settings as SettingsIcon, Book, Home, PlusCircle, GraduationCap, BookCopy, HelpCircle, UserPlus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const Header = () => {
  const { user, universityId, universityName } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Effect to close the mobile menu when route changes
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  // Handle logout
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success('Du wurdest erfolgreich abgemeldet');
      navigate('/');
    } catch (error) {
      console.error('Error logging out:', error);
      toast.error('Fehler beim Abmelden');
    }
  };

  // Mobile menu toggle
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // Navigation items
  const navItems = [
    { label: 'Dashboard', href: '/dashboard', icon: <Home className="h-4 w-4 mr-2" /> },
    { label: 'Training', href: '/training', icon: <Book className="h-4 w-4 mr-2" /> },
    { label: 'Collaboration', href: '/collab', icon: <UserPlus className="h-4 w-4 mr-2" /> },
    { label: 'Tutorial', href: '/tutorial', icon: <HelpCircle className="h-4 w-4 mr-2" /> },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <div className="flex items-center">
          <Link to="/" className="font-bold text-xl flex items-center">
            <GraduationCap className="h-6 w-6 mr-2" />
            Altfragen.io
          </Link>
          {universityId && universityName && (
            <Badge variant="outline" className="ml-2 hidden md:flex">
              {universityName}
            </Badge>
          )}
        </div>

        {/* Desktop Navigation */}
        {!isMobile && (
          <nav className="flex items-center gap-6 text-sm">
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={`flex items-center transition-colors hover:text-foreground/80 ${
                  location.pathname === item.href ? 'text-foreground font-medium' : 'text-foreground/60'
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            ))}
          </nav>
        )}

        {/* Right side - Theme toggle, Auth buttons/User menu */}
        <div className="flex items-center gap-2">
          <ThemeToggle />

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>
                  {user.email}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/settings')}>
                  <SettingsIcon className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button onClick={() => navigate('/auth')}>Login</Button>
          )}

          {/* Mobile menu toggle */}
          {isMobile && (
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMenu}
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          )}
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMobile && isMenuOpen && (
        <div className="container py-4 border-t">
          <nav className="flex flex-col space-y-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={`flex items-center py-2 ${
                  location.pathname === item.href ? 'text-foreground font-medium' : 'text-foreground/60'
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
