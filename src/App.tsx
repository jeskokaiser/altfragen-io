
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/contexts/AuthContext";
import { UserPreferencesProvider } from "@/contexts/UserPreferencesContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { Toaster } from "sonner";
import MainLayout from "@/components/layout/MainLayout";

// Import pages
import Index from "@/pages/Index";
import Dashboard from "@/pages/Dashboard";
import Training from "@/pages/Training";
import Auth from "@/pages/Auth";
import Settings from "@/pages/Settings";
import ArchivedDatasets from "@/pages/ArchivedDatasets";
import UnclearQuestions from "@/pages/UnclearQuestions";
import CollabSessions from "@/pages/CollabSessions";
import CreateSession from "@/pages/CreateSession";
import SessionDetails from "@/pages/SessionDetails";
import Tutorial from "@/pages/Tutorial";
import Terms from "@/pages/Terms";
import Impressum from "@/pages/Impressum";
import Changelog from "@/pages/Changelog";
import AICommentaryAdmin from "@/pages/AICommentaryAdmin";

const queryClient = new QueryClient();

function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <UserPreferencesProvider>
            <QueryClientProvider client={queryClient}>
              <div className="min-h-screen bg-background">
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/*" element={
                    <MainLayout>
                      <Routes>
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/training" element={<Training />} />
                        <Route path="/settings" element={<Settings />} />
                        <Route path="/archived" element={<ArchivedDatasets />} />
                        <Route path="/unclear" element={<UnclearQuestions />} />
                        <Route path="/sessions" element={<CollabSessions />} />
                        <Route path="/sessions/create" element={<CreateSession />} />
                        <Route path="/sessions/:id" element={<SessionDetails />} />
                        <Route path="/tutorial" element={<Tutorial />} />
                        <Route path="/terms" element={<Terms />} />
                        <Route path="/impressum" element={<Impressum />} />
                        <Route path="/changelog" element={<Changelog />} />
                        <Route path="/admin/ai-commentary" element={<AICommentaryAdmin />} />
                      </Routes>
                    </MainLayout>
                  } />
                </Routes>
                <Toaster />
              </div>
            </QueryClientProvider>
          </UserPreferencesProvider>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;
