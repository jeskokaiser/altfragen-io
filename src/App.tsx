
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Training from "./pages/Training";
import Impressum from "./pages/Impressum";
import Terms from "./pages/Terms";
import UnclearQuestions from "./pages/UnclearQuestions";
import Tutorial from "./pages/Tutorial";
import Footer from "./components/Footer";
import Dashboard from "./components/Dashboard";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/auth" />;
  }

  return <>{children}</>;
};

const AppContent = () => {
  const location = useLocation();
  const showFooter = location.pathname === '/auth' || 
                    location.pathname === '/' || 
                    location.pathname === '/dashboard';

  return (
    <div className="min-h-screen flex flex-col dark:bg-slate-900">
      <div className="flex-grow">
        <Toaster />
        <Sonner />
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/" element={<Index />} />
          <Route path="/training" element={
            <ProtectedRoute>
              <Training />
            </ProtectedRoute>
          } />
          <Route path="/unclear-questions/:filename" element={
            <ProtectedRoute>
              <UnclearQuestions />
            </ProtectedRoute>
          } />
          <Route path="/tutorial" element={
            <ProtectedRoute>
              <Tutorial />
            </ProtectedRoute>
          } />
          <Route path="/impressum" element={<Impressum />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
        {showFooter && <Footer />}
      </div>
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider>
          <TooltipProvider>
            <AppContent />
          </TooltipProvider>
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
