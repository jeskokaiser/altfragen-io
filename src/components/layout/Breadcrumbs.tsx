
import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ChevronRight, Home, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Breadcrumbs = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const pathnames = location.pathname.split('/').filter(x => x);

  const crumbLabels: Record<string, string> = {
    dashboard: 'Dashboard',
    training: 'Training',
    results: 'Ergebnisse',
    settings: 'Einstellungen',
    archived: 'Archiv',
    tutorial: 'Tutorial',
    unclear: 'Unklare Fragen',
    "unclear-questions": 'Unklare Fragen',
    changelog: 'Änderungsprotokoll',
    terms: 'Nutzungsbedingungen',
    impressum: 'Impressum'
  };

  // Don't show breadcrumbs for landing page or auth page
  if (location.pathname === '/' || location.pathname === '/auth') {
    return null;
  }

  // Go back function
  const handleGoBack = () => {
    navigate(-1);
  };

  // Get the parent route for special cases
  const getParentRoute = (pathParts: string[]): string => {
    if (pathParts.length <= 1) return '/dashboard';
    
    if (pathParts[0] === 'training' && pathParts[1] === 'results') {
      return '/training';
    }
    
    if (pathParts[0] === 'unclear-questions') {
      return '/dashboard';
    }
    
    return `/${pathParts.slice(0, -1).join('/')}`;
  };

  const hasParentRoute = pathnames.length > 0;
  const parentRoute = getParentRoute(pathnames);

  return (
    <nav className="container mx-auto px-4 py-2 flex items-center text-sm text-muted-foreground">
      {hasParentRoute && (
        <Button 
          variant="ghost" 
          size="sm" 
          className="mr-2 h-8 px-2" 
          onClick={handleGoBack}
        >
          <ChevronLeft className="h-3.5 w-3.5 mr-1" />
          Zurück
        </Button>
      )}
      
      <Link to="/dashboard" className="hover:text-primary flex items-center">
        <Home className="h-3.5 w-3.5 mr-1" />
        Home
      </Link>
      
      {pathnames.map((name, index) => {
        // Skip showing "results" as a separate crumb if it's part of "training/results"
        if (name === 'results' && pathnames[index - 1] === 'training') {
          return null;
        }
        
        const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`;
        const isLast = index === pathnames.length - 1;
        
        // Special case for "training/results"
        const label = name === 'results' && pathnames[index - 1] === 'training' 
          ? 'Trainingsergebnisse' 
          : crumbLabels[name] || name;
        
        return (
          <React.Fragment key={routeTo}>
            <ChevronRight className="h-3.5 w-3.5 mx-1" />
            {isLast ? (
              <span className="font-medium text-foreground">
                {label}
              </span>
            ) : (
              <Link to={routeTo} className="hover:text-primary">
                {label}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};

export default Breadcrumbs;
