
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/contexts/AuthContext";
import { UserPreferencesProvider } from "@/contexts/UserPreferencesContext";
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { Toaster } from "sonner";
import MainLayout from "@/components/layout/MainLayout";

// Import pages
import Index from "@/pages/Index";
import Auth from "@/pages/Auth";
import TermsPage from "@/pages/Terms";
import ImpressumPage from "@/pages/Impressum";
import PrivacyPage from "@/pages/Privacy";
import AGBPage from "@/pages/AGB";
import WiderrufPage from "@/pages/Widerruf";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache data for 5 minutes
      staleTime: 5 * 60 * 1000,
      // Keep cache for 10 minutes
      gcTime: 10 * 60 * 1000,
      // Retry failed requests 2 times
      retry: 2,
      // Don't refetch on window focus by default
      refetchOnWindowFocus: false,
      // Don't refetch on reconnect by default
      refetchOnReconnect: false,
    },
  },
});

function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <SubscriptionProvider>
            <UserPreferencesProvider>
              <QueryClientProvider client={queryClient}>
                <div className="min-h-screen bg-background">
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/terms" element={<TermsPage />} />
                    <Route path="/impressum" element={<ImpressumPage />} />
                    <Route path="/privacy" element={<PrivacyPage />} />
                    <Route path="/agb" element={<AGBPage />} />
                    <Route path="/widerruf" element={<WiderrufPage />} />
                    <Route path="/*" element={<MainLayout />} />
                  </Routes>
                  <Toaster />
                </div>
              </QueryClientProvider>
            </UserPreferencesProvider>
          </SubscriptionProvider>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;
