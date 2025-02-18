
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';
import MainLayout from './components/layout/MainLayout';
import Index from './pages/Index';
import Auth from './pages/Auth';
import Dashboard from './components/Dashboard';
import Training from './pages/Training';
import UnclearQuestions from './pages/UnclearQuestions';
import Tutorial from './pages/Tutorial';
import Terms from './pages/Terms';
import Changelog from './pages/Changelog';
import Impressum from './pages/Impressum';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <ThemeProvider>
          <AuthProvider>
            <MainLayout>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/training" element={<Training />} />
                <Route path="/unclear" element={<UnclearQuestions />} />
                <Route path="/tutorial" element={<Tutorial />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/changelog" element={<Changelog />} />
                <Route path="/impressum" element={<Impressum />} />
              </Routes>
            </MainLayout>
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
