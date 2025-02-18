import React from 'react';
import { useLocation, Routes, Route } from 'react-router-dom';
import Header from './Header/Header';
import Settings from '@/pages/Settings';

const MainLayout = () => {
  const location = useLocation();
  const isLandingPage = location.pathname === '/';
  const isAuthPage = location.pathname === '/auth';

  return (
    <div className="min-h-screen flex flex-col">
      {!isLandingPage && !isAuthPage && <Header />}
      <main className="flex-1">
        <Routes>
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>
    </div>
  );
};

export default MainLayout;
