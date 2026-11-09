import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useAdminRole } from '@/hooks/useAdminRole';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import {
  Menu,
  X,
  LogOut,
  User,
  Settings as SettingsIcon,
  Home,
  HelpCircle,
  GraduationCap,
  Crown,
  Shield,
  Bug,
  Search as SearchIcon,
  ListChecks,
} from 'lucide-react';
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
  const { user, logout } = useAuth();
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

  // Sessions stays highlighted inside a running session and its analytics.
  const isActive = (href: string) =>
    href === '/training/sessions'
      ? location.pathname.startsWith('/training')
      : location.pathname === href;

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const mainNavItems = [
    { label: 'Dashboard', href: '/dashboard', icon: <Home className="h-4 w-4 mr-2" /> },
    {
      label: 'Sessions',
      href: '/training/sessions',
      icon: <ListChecks className="h-4 w-4 mr-2" />,
    },
    { label: 'Suchen', href: '/search', icon: <SearchIcon className="h-4 w-4 mr-2" /> },
    {
      label: 'Premium',
      href: '/subscription',
      icon: <Crown className={`mr-2 h-4 w-4 ${subscribed ? 'text-premium' : ''}`} />,
    },
    ...(isAdmin
      ? [
          {
            label: 'Admin',
            href: '/ai-commentary',
            icon: <Shield className="mr-2 h-4 w-4" />,
          },
        ]
      : []),
  ];

  const userMenuItems = [
    { label: 'Tutorial', href: '/tutorial', icon: <HelpCircle className="mr-2 h-4 w-4" /> },
    {
      label: 'Feedback/Bug melden',
      icon: <Bug className="mr-2 h-4 w-4" />,
      onClick: () => {
        const subject = encodeURIComponent('Feedback/Bug Report - Altfragen.io');
        const body = encodeURIComponent(`Hallo Altfragen.io Team,

ich möchte euch Feedback geben oder einen Bug melden:

Beschreibung:
[Hier dein Feedback oder der gefundene Bug]

Optional:

Schritte zur Reproduktion (falls Bug):
Erwartetes Verhalten:
Tatsächliches Verhalten:


Zusätzliche Informationen:
- Browser: ${navigator.userAgent}
- Aktuelle Seite: ${window.location.href}
- Zeitpunkt: ${new Date().toLocaleString('de-DE')}

Vielen Dank!
`);
        window.location.href = `mailto:hallo@altfragen.io?subject=${subject}&body=${body}`;
      },
    },
  ];

  const allNavItems = [...mainNavItems, ...userMenuItems];

  return (
    <header className="sticky top-0 z-nav w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-16 max-w-page items-center justify-between gap-4 px-4 md:px-6">
        <div className="flex items-center">
          <Link
            to="/"
            className="flex items-center gap-2 rounded-md text-lg font-bold tracking-tight"
          >
            <GraduationCap aria-hidden="true" className="h-6 w-6 text-primary" />
            Altfragen.io
          </Link>
        </div>

        {user && !isMobile && (
          <nav aria-label="Hauptnavigation" className="flex items-center gap-1 text-sm">
            {mainNavItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                aria-current={isActive(item.href) ? 'page' : undefined}
                className={`flex items-center rounded-md px-3 py-2 transition-colors hover:bg-muted hover:text-foreground ${
                  isActive(item.href)
                    ? 'bg-muted font-semibold text-foreground'
                    : 'text-muted-foreground'
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
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full"
                    aria-label="Konto-Menü"
                  >
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>{user.email}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {userMenuItems.map((item) => (
                    <DropdownMenuItem
                      key={item.label}
                      onClick={() => ('onClick' in item ? item.onClick() : navigate(item.href))}
                    >
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
                      <Shield className="mr-2 h-4 w-4" />
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
                  aria-label={isMenuOpen ? 'Menü schließen' : 'Menü öffnen'}
                  aria-expanded={isMenuOpen}
                  aria-controls="mobile-nav"
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
        <div id="mobile-nav" className="border-t bg-background px-4 py-3">
          <nav aria-label="Hauptnavigation" className="flex flex-col">
            {allNavItems.map((item) =>
              'onClick' in item ? (
                <button
                  key={item.label}
                  onClick={item.onClick}
                  className="flex min-h-11 items-center rounded-md px-2 text-left text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  {item.icon}
                  {item.label}
                </button>
              ) : (
                <Link
                  key={item.href}
                  to={item.href}
                  aria-current={isActive(item.href) ? 'page' : undefined}
                  className={`flex min-h-11 items-center rounded-md px-2 hover:bg-muted ${
                    isActive(item.href)
                      ? 'bg-muted font-semibold text-foreground'
                      : 'text-muted-foreground'
                  }`}
                >
                  {item.icon}
                  {item.label}
                </Link>
              ),
            )}
          </nav>
        </div>
      )}
    </header>
  );
};

export default Navbar;
