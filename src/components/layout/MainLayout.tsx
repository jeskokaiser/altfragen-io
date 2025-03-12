
import React from 'react';
import { useLocation, useRoutes } from 'react-router-dom';
import Header from './Header/Header';
import Footer from '@/components/Footer';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import routes from '@/routes';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';

const MainLayout = () => {
  const location = useLocation();
  const isLandingPage = location.pathname === '/';
  const isAuthPage = location.pathname === '/auth';
  const isTrainingPage = location.pathname.includes('/training');
  const shouldShowFooter = !isTrainingPage && !isLandingPage && !location.pathname.includes('/results');
  const shouldShowBreadcrumbs = !isLandingPage && !isAuthPage;
  
  // Use the routes configuration
  const routeElements = useRoutes(routes);

  return (
    <div className="min-h-screen flex flex-col">
      {!isLandingPage && !isAuthPage && <Header />}
      {shouldShowBreadcrumbs && <Breadcrumbs />}
      
      <main className="flex-1">
        <ErrorBoundary>
          {routeElements}
        </ErrorBoundary>
      </main>
      
      {shouldShowFooter && <Footer />}
    </div>
  );
};

export default MainLayout;
