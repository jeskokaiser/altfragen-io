import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/contexts/AuthContext';
import CampaignBanner from '@/components/campaigns/CampaignBanner';
import CampaignToast from '@/components/campaigns/CampaignToast';
import CheckoutStatusNotification from '@/components/subscription/CheckoutStatusNotification';
import { SkipLink } from '@/components/ds/SkipLink';
import { LoadingState } from '@/components/ds/States';

// Import pages
import DashboardPage from '@/pages/Dashboard';
import SettingsPage from '@/pages/Settings';
import SubscriptionPage from '@/pages/Subscription';
import UnclearQuestionsPage from '@/pages/UnclearQuestions';
import AICommentaryAdminPage from '@/pages/AICommentaryAdmin';
import TutorialPage from '@/pages/Tutorial';
import TrainingSessionsPage from '@/pages/TrainingSessions';
import TrainingSessionRunnerPage from '@/pages/TrainingSessionRunner';
import TrainingSessionOneOffPage from '@/pages/TrainingSessionOneOff';
import ExamAnalyticsPage from '@/pages/ExamAnalytics';
import TrainingSessionAnalyticsPage from '@/pages/TrainingSessionAnalytics';
import QuestionSearchPage from '@/pages/QuestionSearch';

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
    return <LoadingState className="min-h-dvh" />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <SkipLink />
      <Navbar />
      <CampaignBanner />
      <CampaignToast />
      <CheckoutStatusNotification />
      <main id="main" tabIndex={-1} className="flex-1 focus:outline-none">
        <Routes>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/training" element={<Navigate to="/training/sessions" replace />} />
          <Route path="/training/sessions" element={<TrainingSessionsPage />} />
          <Route path="/training/session/:sessionId" element={<TrainingSessionRunnerPage />} />
          <Route
            path="/training/session/:sessionId/analytics"
            element={<TrainingSessionAnalyticsPage />}
          />
          <Route path="/training/one-off" element={<TrainingSessionOneOffPage />} />
          <Route path="/exam/:examId/analytics" element={<ExamAnalyticsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/subscription" element={<SubscriptionPage />} />
          <Route path="/unclear-questions/:filename" element={<UnclearQuestionsPage />} />
          <Route path="/ai-commentary" element={<AICommentaryAdminPage />} />
          <Route path="/tutorial" element={<TutorialPage />} />
          <Route path="/search" element={<QuestionSearchPage />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
};

export default MainLayout;
