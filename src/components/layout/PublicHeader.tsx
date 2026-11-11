import { Link, useLocation } from 'react-router-dom';
import { GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useAuth } from '@/contexts/AuthContext';

/** Header for the public pages (login, legal texts, cancellation): brand, theme, way into the app. */
const PublicHeader = () => {
  const { user } = useAuth();
  const { pathname } = useLocation();

  return (
    <header className="sticky top-0 z-nav w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-16 max-w-page items-center justify-between gap-4 px-4 md:px-6">
        <Link
          to="/"
          className="flex items-center gap-2 rounded-md text-lg font-bold tracking-tight"
        >
          <GraduationCap aria-hidden="true" className="h-6 w-6 text-primary" />
          Altfragen.io
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {user ? (
            <Button asChild variant="outline">
              <Link to="/dashboard">
                {/* short label so logo, theme and button fit on 320 px phones */}
                <span className="sm:hidden">Dashboard</span>
                <span className="hidden sm:inline">Zum Dashboard</span>
              </Link>
            </Button>
          ) : (
            pathname !== '/auth' && (
              <Button asChild>
                <Link to="/auth">Anmelden</Link>
              </Button>
            )
          )}
        </div>
      </div>
    </header>
  );
};

export default PublicHeader;
