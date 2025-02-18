
import React from 'react';
import { useLocation } from 'react-router-dom';
import Header from './Header/Header';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  const location = useLocation();
  const isLandingPage = location.pathname === '/';
  const isAuthPage = location.pathname === '/auth';

  return (
    <div className="min-h-screen flex flex-col">
      {!isLandingPage && !isAuthPage && <Header />}
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
};

export default MainLayout;
