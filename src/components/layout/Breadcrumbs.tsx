
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

const Breadcrumbs = () => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter(x => x);

  const crumbLabels: Record<string, string> = {
    dashboard: 'Dashboard',
    training: 'Training',
    results: 'Ergebnisse',
    settings: 'Einstellungen',
    archived: 'Archiv',
    tutorial: 'Tutorial',
    unclear: 'Unklare Fragen',
    changelog: 'Änderungsprotokoll',
    terms: 'Nutzungsbedingungen',
    impressum: 'Impressum'
  };

  // Don't show breadcrumbs for landing page or auth page
  if (location.pathname === '/' || location.pathname === '/auth') {
    return null;
  }

  return (
    <nav className="container mx-auto px-4 py-2 flex items-center text-sm text-muted-foreground">
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
