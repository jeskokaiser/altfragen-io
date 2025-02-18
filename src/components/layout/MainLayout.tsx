
import React from 'react';
import { useLocation, Routes, Route } from 'react-router-dom';
import Header from './Header/Header';
import Settings from '@/pages/Settings';
import Training from '@/pages/Training';
import Index from '@/pages/Index';
import Auth from '@/pages/Auth';
import Terms from '@/pages/Terms';
import Impressum from '@/pages/Impressum';
import Tutorial from '@/pages/Tutorial';
import UnclearQuestions from '@/pages/UnclearQuestions';
import Changelog from '@/pages/Changelog';
import Dashboard from '@/components/Dashboard';

const MainLayout = () => {
  const location = useLocation();
  const isLandingPage = location.pathname === '/';
  const isAuthPage = location.pathname === '/auth';

  return (
    <div className="min-h-screen flex flex-col">
      {!isLandingPage && !isAuthPage && <Header />}
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/training" element={<Training />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/impressum" element={<Impressum />} />
          <Route path="/tutorial" element={<Tutorial />} />
          <Route path="/unclear-questions" element={<UnclearQuestions />} />
          <Route path="/changelog" element={<Changelog />} />
          <Route path="/dashboard" element={<Dashboard />} />
          {/* Catch all other routes and redirect to index */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
};

export default MainLayout;
