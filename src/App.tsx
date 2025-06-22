
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { ThemeProvider } from "@/contexts/ThemeContext"
import { AuthProvider } from '@/contexts/AuthContext';
import { SubscriptionProvider } from '@/contexts/SubscriptionContext';
import { UserPreferencesProvider } from '@/contexts/UserPreferencesContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Index from '@/pages/Index';
import Dashboard from '@/pages/Dashboard';
import Training from '@/pages/Training';
import Settings from '@/pages/Settings';
import CollaborationSessions from '@/pages/CollabSessions';
import AICommentaryAdmin from '@/pages/AICommentaryAdmin';
import { Toaster } from "@/components/ui/sonner"
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AdminPanel from '@/pages/AdminPanel';

const queryClient = new QueryClient();

function App() {
  return (
    <Router>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <SubscriptionProvider>
              <UserPreferencesProvider>
                <div className="min-h-screen bg-background text-foreground">
                  <Navbar />
                  <main className="flex-1">
                    <Routes>
                      <Route path="/" element={<Index />} />
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/training" element={<Training />} />
                      <Route path="/settings" element={<Settings />} />
                      <Route path="/collab-sessions" element={<CollaborationSessions />} />
                      <Route path="/ai-commentary-admin" element={<AICommentaryAdmin />} />
                      <Route path="/admin" element={<AdminPanel />} />
                    </Routes>
                  </main>
                  <Footer />
                  <Toaster />
                </div>
              </UserPreferencesProvider>
            </SubscriptionProvider>
          </AuthProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;
