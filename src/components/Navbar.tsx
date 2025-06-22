
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useAdminRole } from '@/hooks/useAdminRole';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Menu, X, LogOut, User, Settings as SettingsIcon, Book, Home, UserPlus, HelpCircle, GraduationCap, Crown, Shield } from 'lucide-react';
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
import { toast } from 'sonner';

const Navbar: React.FC = () => {
  const { user, logout, universityId, universityName } = useAuth();
  const { subscribed } = useSubscription();
  const { isAdmin } = useAdminRole();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Du wurdest erfolgreich abgemeldet');
      navigate('/');
    } catch (error) {
      console.error('Error logging out:', error);
      toast.error('Fehler beim Abmelden');
    }
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const mainNavItems = [
    { label: 'Dashboard', href: '/dashboard', icon: <Home className="h-4 w-4 mr-2" /> },
    { label: 'Premium', href: '/subscription', icon: <Crown className={`mr-2 h-4 w-4 ${subscribed ? 'text-yellow-600' : ''}`} /> },
    ...(isAdmin ? [{ label: 'Admin', href: '/ai-commentary', icon: <Shield className="mr-2 h-4 w-4 text-red-600" /> }] : []),
  ];
  
  const userMenuItems = [
      { label: 'Zusammenarbeit', href: '/collab', icon: <UserPlus className="mr-2 h-4 w-4" /> },
      { label: 'Tutorial', href: '/tutorial', icon: <HelpCircle className="mr-2 h-4 w-4" /> },
  ];

  const allNavItems = [...mainNavItems, ...userMenuItems];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center">
          <Link to="/" className="font-bold text-xl flex items-center gap-2">
            <GraduationCap className="h-6 w-6" />
            Altfragen.io
          </Link>
        </div>

        {user && !isMobile && (
          <nav className="flex items-center gap-6 text-sm">
            {mainNavItems.map((item) => (
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

        <div className="flex items-center gap-2">
          <ThemeToggle />

          {user ? (
            <>
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
                  {userMenuItems.map((item) => (
                    <DropdownMenuItem key={item.href} onClick={() => navigate(item.href)}>
                      {item.icon}
                      {item.label}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/settings')}>
                    <SettingsIcon className="mr-2 h-4 w-4" />
                    Einstellungen
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem onClick={() => navigate('/ai-commentary')}>
                      <Shield className="mr-2 h-4 w-4 text-red-600" />
                      Admin Panel
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Abmelden
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {isMobile && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleMenu}
                  aria-label="Menü öffnen/schließen"
                >
                  {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </Button>
              )}
            </>
          ) : (
            <Button onClick={() => navigate('/auth')}>Anmelden</Button>
          )}
        </div>
      </div>

      {user && isMobile && isMenuOpen && (
        <div className="container py-4 border-t bg-background">
          <nav className="flex flex-col space-y-4">
            {allNavItems.map((item) => (
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

export default Navbar;
