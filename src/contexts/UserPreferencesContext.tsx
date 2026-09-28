import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';
import {
  createUserPreferences,
  defaultUserPreferences,
  fetchUserPreferences,
  mergePreferences,
  saveUserPreferences,
  type UserPreferences,
} from '@/services/UserPreferencesService';

export type { KeyboardBindings, StatisticsDateRange } from '@/services/UserPreferencesService';

interface UserPreferencesContextType {
  preferences: UserPreferences;
  isLoading: boolean;
  updatePreferences: (newPreferences: Partial<UserPreferences>) => Promise<void>;
  archiveDataset: (filename: string) => Promise<void>;
  restoreDataset: (filename: string) => Promise<void>;
  isDatasetArchived: (filename: string) => boolean;
  updateSelectedUniversityDatasets: (datasets: string[]) => Promise<void>;
  isModelEnabled: (modelName: string) => boolean;
}

const UserPreferencesContext = createContext<UserPreferencesContextType | undefined>(undefined);

export function UserPreferencesProvider({ children }: { children: React.ReactNode }) {
  const [preferences, setPreferences] = useState<UserPreferences>(defaultUserPreferences);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadUserPreferences();
    } else {
      setPreferences(defaultUserPreferences());
      setIsLoading(false);
    }
  }, [user]);

  const loadUserPreferences = async () => {
    if (!user) return;

    try {
      const stored = await fetchUserPreferences(user.id);
      setPreferences(stored ?? (await createUserPreferences(user.id)));
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
      await saveUserPreferences(user.id, mergePreferences(preferences, newPreferences));

      setPreferences((prev) => ({ ...prev, ...newPreferences }));
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

    const newArchivedDatasets = preferences.archivedDatasets.filter((f) => f !== filename);
    await updatePreferences({ archivedDatasets: newArchivedDatasets });
    toast.success('Dataset erfolgreich wiederhergestellt');
  };

  const isDatasetArchived = (filename: string): boolean => {
    return preferences.archivedDatasets.includes(filename);
  };

  const updateSelectedUniversityDatasets = async (datasets: string[]) => {
    await updatePreferences({ selectedUniversityDatasets: datasets });
  };

  const isModelEnabled = (modelName: string): boolean => {
    return preferences.selectedAIModels.includes(modelName);
  };

  return (
    <UserPreferencesContext.Provider
      value={{
        preferences,
        isLoading,
        updatePreferences,
        archiveDataset,
        restoreDataset,
        isDatasetArchived,
        updateSelectedUniversityDatasets,
        isModelEnabled,
      }}
    >
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
