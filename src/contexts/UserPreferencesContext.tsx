
import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';
import { UserPreferences } from '@/types/UserPreferences';
import { 
  loadUserPreferences,
  updateUserPreferences
} from '@/services/UserPreferencesService';

interface UserPreferencesContextType {
  preferences: UserPreferences;
  isLoading: boolean;
  updatePreferences: (newPreferences: Partial<UserPreferences>) => Promise<void>;
  archiveDataset: (filename: string) => Promise<void>;
  restoreDataset: (filename: string) => Promise<void>;
  isDatasetArchived: (filename: string) => boolean;
}

const UserPreferencesContext = createContext<UserPreferencesContextType | undefined>(undefined);

export function UserPreferencesProvider({ children }: { children: React.ReactNode }) {
  const [preferences, setPreferences] = useState<UserPreferences>({ 
    immediateFeedback: false,
    archivedDatasets: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  // Memoize the loadUserPreferencesData function to prevent unnecessary re-renders
  const loadUserPreferencesData = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const userPreferences = await loadUserPreferences(user.id);
      setPreferences(userPreferences);
    } catch (error) {
      console.error('Error loading preferences:', error);
      toast.error('Failed to load preferences');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadUserPreferencesData();
    } else {
      setPreferences({ immediateFeedback: false, archivedDatasets: [] });
      setIsLoading(false);
    }
  }, [user, loadUserPreferencesData]);

  // Memoize the update function to prevent unnecessary re-renders
  const updatePreferences = useCallback(async (newPreferences: Partial<UserPreferences>) => {
    if (!user) return;

    try {
      await updateUserPreferences(user.id, newPreferences);
      setPreferences(prev => ({ ...prev, ...newPreferences }));
      toast.success('Preferences updated successfully');
    } catch (error) {
      console.error('Error updating preferences:', error);
      toast.error('Failed to update preferences');
    }
  }, [user]);

  // Memoize these functions to prevent unnecessary re-renders
  const archiveDataset = useCallback(async (filename: string) => {
    if (!user || preferences.archivedDatasets.includes(filename)) return;
    
    const newArchivedDatasets = [...preferences.archivedDatasets, filename];
    await updatePreferences({ archivedDatasets: newArchivedDatasets });
    toast.success('Dataset archived successfully');
  }, [user, preferences.archivedDatasets, updatePreferences]);

  const restoreDataset = useCallback(async (filename: string) => {
    if (!user) return;
    
    const newArchivedDatasets = preferences.archivedDatasets.filter(f => f !== filename);
    await updatePreferences({ archivedDatasets: newArchivedDatasets });
    toast.success('Dataset restored successfully');
  }, [user, preferences.archivedDatasets, updatePreferences]);

  const isDatasetArchived = useCallback((filename: string): boolean => {
    return preferences.archivedDatasets.includes(filename);
  }, [preferences.archivedDatasets]);

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    preferences, 
    isLoading, 
    updatePreferences,
    archiveDataset,
    restoreDataset,
    isDatasetArchived
  }), [
    preferences, 
    isLoading, 
    updatePreferences,
    archiveDataset,
    restoreDataset,
    isDatasetArchived
  ]);

  return (
    <UserPreferencesContext.Provider value={contextValue}>
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
