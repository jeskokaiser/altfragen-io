
import React from "react";
import { BrowserRouter as Router } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/contexts/AuthContext";
import { UserPreferencesProvider } from "@/contexts/UserPreferencesContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { Toaster } from "sonner";
import MainLayout from "@/components/layout/MainLayout";

const queryClient = new QueryClient();

function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <UserPreferencesProvider>
            <QueryClientProvider client={queryClient}>
              <div className="min-h-screen bg-background">
                <MainLayout />
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
