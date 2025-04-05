
import React from 'react';
import { useLocation, Routes, Route, Navigate } from 'react-router-dom';
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
import ArchivedDatasets from '@/pages/ArchivedDatasets';
import CollabSessions from '@/pages/CollabSessions';
import CreateSession from '@/pages/CreateSession';
import SessionDetails from '@/pages/SessionDetails';
import Footer from '@/components/Footer';

const MainLayout = () => {
  const location = useLocation();
  const isLandingPage = location.pathname === '/';
  const isAuthPage = location.pathname === '/auth';
  const isTrainingPage = location.pathname === '/training';
  const isCollabSessionPage = location.pathname.includes('/collab-session/');
  const shouldShowFooter = !isTrainingPage && !location.pathname.includes('/results') && !isCollabSessionPage;

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
          <Route path="/unclear-questions/:filename" element={<UnclearQuestions />} />
          <Route path="/changelog" element={<Changelog />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/archived" element={<ArchivedDatasets />} />
          <Route path="/collab" element={<CollabSessions />} />
          <Route path="/collab/create" element={<CreateSession />} />
          <Route path="/collab-session/:sessionId" element={<SessionDetails />} />
          {/* Catch all other routes and redirect to index */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      {shouldShowFooter && <Footer />}
    </div>
  );
};

export default MainLayout;
