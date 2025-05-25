import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Index from "@/pages/Index";
import Dashboard from "@/pages/Dashboard";
import Auth from "@/pages/Auth";
import Tutorial from "@/pages/Tutorial";
import Navbar from "@/components/Navbar";
import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster } from "sonner";
import { QueryClient } from "@tanstack/react-query";
import CreateSession from "@/pages/CreateSession";
import CollabSessions from "@/pages/CollabSessions";
import SessionDetails from "@/pages/SessionDetails";
import LiveSessionView from '@/components/collaboration/LiveSessionView';

function App() {
  return (
    <Router>
      <AuthProvider>
        <QueryClient>
          <div className="min-h-screen bg-background">
            <Navbar />
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/tutorial" element={<Tutorial />} />
                <Route path="/collab" element={<CollabSessions />} />
                <Route path="/collab/create" element={<CreateSession />} />
                <Route path="/collab-session/:sessionId" element={<LiveSessionView />} />
              </Routes>
            </main>
            <Toaster />
          </div>
        </QueryClient>
      </AuthProvider>
    </Router>
  );
}

export default App;
