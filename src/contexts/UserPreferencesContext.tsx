
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

interface UserPreferences {
  immediateFeedback: boolean;
  archivedDatasets: string[];
  selectedUniversityDatasets: string[];
}

interface UserPreferencesContextType {
  preferences: UserPreferences;
  isLoading: boolean;
  updatePreferences: (newPreferences: Partial<UserPreferences>) => Promise<void>;
  archiveDataset: (filename: string) => Promise<void>;
  restoreDataset: (filename: string) => Promise<void>;
  isDatasetArchived: (filename: string) => boolean;
  updateSelectedUniversityDatasets: (datasets: string[]) => Promise<void>;
}

const UserPreferencesContext = createContext<UserPreferencesContextType | undefined>(undefined);

export function UserPreferencesProvider({ children }: { children: React.ReactNode }) {
  const [preferences, setPreferences] = useState<UserPreferences>({ 
    immediateFeedback: false,
    archivedDatasets: [],
    selectedUniversityDatasets: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadUserPreferences();
    } else {
      setPreferences({ 
        immediateFeedback: false, 
        archivedDatasets: [],
        selectedUniversityDatasets: [] 
      });
      setIsLoading(false);
    }
  }, [user]);

  const loadUserPreferences = async () => {
    if (!user) return;

    try {
      const { data: existingPrefs, error: fetchError } = await supabase
        .from('user_preferences')
        .select()
        .eq('user_id', user.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      if (existingPrefs) {
        setPreferences({ 
          immediateFeedback: existingPrefs.immediate_feedback,
          archivedDatasets: existingPrefs.archived_datasets || [],
          selectedUniversityDatasets: existingPrefs.selected_university_datasets || []
        });
      } else {
        const { error: insertError } = await supabase
          .from('user_preferences')
          .insert({
            user_id: user.id,
            immediate_feedback: false,
            archived_datasets: [],
            selected_university_datasets: []
          });

        if (insertError) throw insertError;
        setPreferences({ 
          immediateFeedback: false, 
          archivedDatasets: [],
          selectedUniversityDatasets: [] 
        });
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
      toast.error('Einstellungen konnten nicht geladen werden');
    } finally {
      setIsLoading(false);
    }
  };

  const updatePreferences = async (newPreferences: Partial<UserPreferences>) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_preferences')
        .update({
          immediate_feedback: newPreferences.immediateFeedback ?? preferences.immediateFeedback,
          archived_datasets: newPreferences.archivedDatasets ?? preferences.archivedDatasets,
          selected_university_datasets: newPreferences.selectedUniversityDatasets ?? preferences.selectedUniversityDatasets,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (error) throw error;

      setPreferences(prev => ({ ...prev, ...newPreferences }));
      toast.success('Einstellungen erfolgreich aktualisiert');
    } catch (error) {
      console.error('Error updating preferences:', error);
      toast.error('Einstellungen konnten nicht aktualisiert werden');
    }
  };

  const archiveDataset = async (filename: string) => {
    if (!user || preferences.archivedDatasets.includes(filename)) return;
    
    const newArchivedDatasets = [...preferences.archivedDatasets, filename];
    await updatePreferences({ archivedDatasets: newArchivedDatasets });
    toast.success('Dataset erfolgreich archiviert');
  };

  const restoreDataset = async (filename: string) => {
    if (!user) return;
    
    const newArchivedDatasets = preferences.archivedDatasets.filter(f => f !== filename);
    await updatePreferences({ archivedDatasets: newArchivedDatasets });
    toast.success('Dataset erfolgreich wiederhergestellt');
  };

  const isDatasetArchived = (filename: string): boolean => {
    return preferences.archivedDatasets.includes(filename);
  };

  const updateSelectedUniversityDatasets = async (datasets: string[]) => {
    await updatePreferences({ selectedUniversityDatasets: datasets });
  };

  return (
    <UserPreferencesContext.Provider value={{ 
      preferences, 
      isLoading, 
      updatePreferences,
      archiveDataset,
      restoreDataset,
      isDatasetArchived,
      updateSelectedUniversityDatasets
    }}>
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
