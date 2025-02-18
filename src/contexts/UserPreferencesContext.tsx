
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

interface UserPreferences {
  immediateFeedback: boolean;
}

interface UserPreferencesContextType {
  preferences: UserPreferences;
  isLoading: boolean;
  updatePreferences: (newPreferences: Partial<UserPreferences>) => Promise<void>;
}

const UserPreferencesContext = createContext<UserPreferencesContextType | undefined>(undefined);

export function UserPreferencesProvider({ children }: { children: React.ReactNode }) {
  const [preferences, setPreferences] = useState<UserPreferences>({ immediateFeedback: false });
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadUserPreferences();
    }
  }, [user]);

  const loadUserPreferences = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('immediate_feedback')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setPreferences({ immediateFeedback: data.immediate_feedback });
      } else {
        // Create default preferences for new users
        const { error: insertError } = await supabase
          .from('user_preferences')
          .insert([{ 
            user_id: user.id, 
            immediate_feedback: false 
          }]);

        if (insertError) throw insertError;
        
        // Set default preferences in state
        setPreferences({ immediateFeedback: false });
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
      toast.error('Failed to load preferences');
    } finally {
      setIsLoading(false);
    }
  };

  const updatePreferences = async (newPreferences: Partial<UserPreferences>) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          immediate_feedback: newPreferences.immediateFeedback ?? preferences.immediateFeedback,
        });

      if (error) throw error;

      setPreferences(prev => ({ ...prev, ...newPreferences }));
      toast.success('Preferences updated successfully');
    } catch (error) {
      console.error('Error updating preferences:', error);
      toast.error('Failed to update preferences');
    }
  };

  return (
    <UserPreferencesContext.Provider value={{ preferences, isLoading, updatePreferences }}>
      {children}
    </UserPreferencesContext.Provider>
  );
}

export const useUserPreferences = () => {
  const context = useContext(UserPreferencesContext);
  if (context === undefined) {
    throw new Error('useUserPreferences must be used within a UserPreferencesProvider');
  }
  return context;
};
