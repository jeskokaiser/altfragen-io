
import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Index from "@/pages/Index";
import Dashboard from "@/pages/Dashboard";
import Auth from "@/pages/Auth";
import Tutorial from "@/pages/Tutorial";
import Settings from "@/pages/Settings";
import { AuthProvider } from "@/contexts/AuthContext";
import { UserPreferencesProvider } from "@/contexts/UserPreferencesContext";
import { Toaster } from "sonner";
import CreateSession from "@/pages/CreateSession";
import CollabSessions from "@/pages/CollabSessions";
import LiveSessionView from '@/components/collaboration/LiveSessionView';
import Navbar from '@/components/Navbar';

const queryClient = new QueryClient();

function App() {
  return (
    <Router>
      <AuthProvider>
        <UserPreferencesProvider>
          <QueryClientProvider client={queryClient}>
            <div className="min-h-screen bg-background">
              <Navbar />
              <main className="flex-1">
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/tutorial" element={<Tutorial />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/collab" element={<CollabSessions />} />
                  <Route path="/collab/create" element={<CreateSession />} />
                  <Route path="/collab-session/:sessionId" element={<LiveSessionView />} />
                </Routes>
              </main>
              <Toaster />
            </div>
          </QueryClientProvider>
        </UserPreferencesProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
