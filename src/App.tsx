
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import { UserPreferencesProvider } from './contexts/UserPreferencesContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Home from './pages/Home';
import DashboardPage from './pages/Dashboard';
import Training from './pages/Training';
import Upload from './pages/Upload';
import UnclearQuestions from './pages/UnclearQuestions';
import ExamSessionPage from './pages/ExamSessionPage';
import ExamSessionReviewPage from './pages/ExamSessionReviewPage';
import ExamSessionStartPage from './pages/ExamSessionStartPage';
import ExamSessionJoinPage from './pages/ExamSessionJoinPage';
import ExamSessionCreatePage from './pages/ExamSessionCreatePage';
import ProfilePage from './pages/ProfilePage';
import UniversityPage from './pages/UniversityPage';
import Admin from './pages/Admin';
import Settings from './pages/Settings';

// Create a client
const queryClient = new QueryClient();

function App() {
  return (
    <Router>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            <UserPreferencesProvider>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/training/:filename?" element={<Training />} />
                <Route path="/upload" element={<Upload />} />
                <Route path="/unclear/:filename" element={<UnclearQuestions />} />
                <Route path="/exam-session/:sessionId" element={<ExamSessionPage />} />
                <Route path="/exam-session/:sessionId/review" element={<ExamSessionReviewPage />} />
                <Route path="/exam-session/:sessionId/start" element={<ExamSessionStartPage />} />
                <Route path="/exam-session/join/:inviteCode?" element={<ExamSessionJoinPage />} />
                <Route path="/exam-session/create" element={<ExamSessionCreatePage />} />
                <Route path="/profile/:userId?" element={<ProfilePage />} />
                <Route path="/university/:universityId" element={<UniversityPage />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/settings" element={<Settings />} />
              </Routes>
            </UserPreferencesProvider>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </Router>
  );
}

export default App;
