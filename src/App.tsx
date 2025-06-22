import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from '@/contexts/AuthContext';
import { SubscriptionProvider } from '@/contexts/SubscriptionContext';
import { UserPreferencesProvider } from '@/contexts/UserPreferencesContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Home from '@/pages/Home';
import Dashboard from '@/pages/Dashboard';
import Training from '@/pages/Training';
import Settings from '@/pages/Settings';
import Pricing from '@/pages/Pricing';
import CollaborationSessions from '@/pages/CollaborationSessions';
import AICommentaryAdmin from '@/pages/AICommentaryAdmin';
import { Toaster } from "@/components/ui/toaster"
import { QueryClient } from '@tanstack/react-query';
import AdminPanel from '@/pages/AdminPanel';

function App() {
  return (
    <Router>
      <ThemeProvider>
        <QueryClient>
          <AuthProvider>
            <SubscriptionProvider>
              <UserPreferencesProvider>
                <div className="min-h-screen bg-background text-foreground">
                  <Navbar />
                  <main className="flex-1">
                    <Routes>
                      <Route path="/" element={<Home />} />
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/training" element={<Training />} />
                      <Route path="/settings" element={<Settings />} />
                      <Route path="/pricing" element={<Pricing />} />
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
        </QueryClient>
      </ThemeProvider>
    </Router>
  );
}

export default App;
