
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Training from "./pages/Training";
import Impressum from "./pages/Impressum";
import Terms from "./pages/Terms";
import UnclearQuestions from "./pages/UnclearQuestions";
import Footer from "./components/Footer";

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
  const showFooter = location.pathname === '/auth' || location.pathname === '/';

  return (
    <div className="min-h-screen flex flex-col">
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
          <Route path="/impressum" element={<Impressum />} />
          <Route path="/terms" element={<Terms />} />
        </Routes>
        {showFooter && <Footer />}
      </div>
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
