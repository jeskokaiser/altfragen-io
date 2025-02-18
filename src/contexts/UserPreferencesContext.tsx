
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
    } else {
      setPreferences({ immediateFeedback: false });
      setIsLoading(false);
    }
  }, [user]);

  const loadUserPreferences = async () => {
    if (!user) return;

    try {
      // First try to get existing preferences
      const { data: existingPrefs, error: fetchError } = await supabase
        .from('user_preferences')
        .select('immediate_feedback')
        .eq('user_id', user.id)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (existingPrefs) {
        setPreferences({ immediateFeedback: existingPrefs.immediate_feedback });
      } else {
        // If no preferences exist, create default ones
        const { error: upsertError } = await supabase
          .from('user_preferences')
          .upsert({
            user_id: user.id,
            immediate_feedback: false
          });

        if (upsertError) throw upsertError;
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
          updated_at: new Date().toISOString()
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
