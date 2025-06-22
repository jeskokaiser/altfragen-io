
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

const queryClient = new QueryClient();

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
