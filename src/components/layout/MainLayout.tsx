
import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/contexts/AuthContext';

// Import pages
import DashboardPage from '@/pages/Dashboard';
import TrainingPage from '@/pages/Training';
import CollabSessionsPage from '@/pages/CollabSessions';
import CreateSessionPage from '@/pages/CreateSession';
import SessionDetailsPage from '@/pages/SessionDetails';
import SettingsPage from '@/pages/Settings';
import SubscriptionPage from '@/pages/Subscription';
import UnclearQuestionsPage from '@/pages/UnclearQuestions';
import ArchivedDatasetsPage from '@/pages/ArchivedDatasets';
import AICommentaryAdminPage from '@/pages/AICommentaryAdmin';
import TutorialPage from '@/pages/Tutorial';
import ChangelogPage from '@/pages/Changelog';

const MainLayout: React.FC = () => {
  const { isReady, isAuthenticated } = useAuthGuard();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isAuthenticated && user && location.pathname !== '/tutorial') {
      const hasSeenTutorialKey = `hasSeenTutorial_${user.id}`;
      const hasSeenTutorial = localStorage.getItem(hasSeenTutorialKey);

      if (!hasSeenTutorial) {
        localStorage.setItem(hasSeenTutorialKey, 'true');
        navigate('/tutorial', { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate, location.pathname]);

  if (!isReady) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/training" element={<TrainingPage />} />
          <Route path="/collab" element={<CollabSessionsPage />} />
          <Route path="/create-session" element={<CreateSessionPage />} />
          <Route path="/session/:sessionId" element={<SessionDetailsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/subscription" element={<SubscriptionPage />} />
          <Route path="/unclear-questions" element={<UnclearQuestionsPage />} />
          <Route path="/archived-datasets" element={<ArchivedDatasetsPage />} />
          <Route path="/ai-commentary" element={<AICommentaryAdminPage />} />
          <Route path="/tutorial" element={<TutorialPage />} />
          <Route path="/changelog" element={<ChangelogPage />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
};

export default MainLayout;
