
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

export interface KeyboardBindings {
  answerA: string;
  answerB: string;
  answerC: string;
  answerD: string;
  answerE: string;
  confirmAnswer: string;
  nextQuestion: string;
  showSolution: string;
}

export interface StatisticsDateRange {
  preset: 'all' | '7days' | '30days' | '90days' | 'custom';
  start?: string; // ISO date string
  end?: string; // ISO date string
}

interface UserPreferences {
  immediateFeedback: boolean;
  archivedDatasets: string[];
  selectedUniversityDatasets: string[];
  keyboardBindings: KeyboardBindings;
  statisticsDateRange: StatisticsDateRange;
  selectedAIModels: string[];
  enhancedAIVersion: 'none' | 'chatgpt' | 'gemini';
}

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
  const defaultKeyboardBindings: KeyboardBindings = {
    answerA: '1',
    answerB: '2',
    answerC: '3',
    answerD: '4',
    answerE: '5',
    confirmAnswer: ' ', // Space bar
    nextQuestion: ' ', // Space bar (same as confirm)
    showSolution: 's', // 's' key for show solution
  };

  const defaultAIModels = ['chatgpt', 'new-gemini', 'mistral', 'perplexity', 'deepseek'];
  
  const [preferences, setPreferences] = useState<UserPreferences>({ 
    immediateFeedback: false,
    archivedDatasets: [],
    selectedUniversityDatasets: [],
    keyboardBindings: defaultKeyboardBindings,
    statisticsDateRange: { preset: 'all' },
    selectedAIModels: defaultAIModels,
    enhancedAIVersion: 'none'
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
        selectedUniversityDatasets: [],
        keyboardBindings: defaultKeyboardBindings,
        statisticsDateRange: { preset: 'all' },
        selectedAIModels: defaultAIModels,
        enhancedAIVersion: 'none'
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
        const selectedAIModels = (existingPrefs as any).selected_ai_models || defaultAIModels;
        const enhancedVersion = (existingPrefs as any).enhanced_ai_version;
        // Handle migration from old boolean to new string format
        let enhancedAIVersion: 'none' | 'chatgpt' | 'gemini' = 'none';
        if (enhancedVersion === 'chatgpt' || enhancedVersion === 'gemini') {
          enhancedAIVersion = enhancedVersion;
        } else if ((existingPrefs as any).show_enhanced_ai_versions === true) {
          // Migrate old boolean: default to chatgpt if it was enabled
          enhancedAIVersion = 'chatgpt';
        }
        
        setPreferences({ 
          immediateFeedback: existingPrefs.immediate_feedback,
          archivedDatasets: existingPrefs.archived_datasets || [],
          selectedUniversityDatasets: existingPrefs.selected_university_datasets || [],
          keyboardBindings: (existingPrefs as any).keyboard_bindings || defaultKeyboardBindings,
          statisticsDateRange: (existingPrefs as any).statistics_date_range || { preset: 'all' },
          selectedAIModels: Array.isArray(selectedAIModels) ? selectedAIModels : defaultAIModels,
          enhancedAIVersion
        });
      } else {
        const { error: insertError } = await supabase
          .from('user_preferences')
          .insert({
            user_id: user.id,
            immediate_feedback: false,
            archived_datasets: [],
            selected_university_datasets: [],
            keyboard_bindings: defaultKeyboardBindings as any,
            statistics_date_range: { preset: 'all' } as any,
            selected_ai_models: defaultAIModels as any,
            enhanced_ai_version: 'none'
          });

        if (insertError) throw insertError;
        setPreferences({ 
          immediateFeedback: false, 
          archivedDatasets: [],
          selectedUniversityDatasets: [],
          keyboardBindings: defaultKeyboardBindings,
          statisticsDateRange: { preset: 'all' },
          selectedAIModels: defaultAIModels,
          enhancedAIVersion: 'none'
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
          keyboard_bindings: (newPreferences.keyboardBindings ?? preferences.keyboardBindings) as any,
          statistics_date_range: (newPreferences.statisticsDateRange ?? preferences.statisticsDateRange) as any,
          selected_ai_models: (newPreferences.selectedAIModels ?? preferences.selectedAIModels) as any,
          enhanced_ai_version: (newPreferences.enhancedAIVersion ?? preferences.enhancedAIVersion) as any,
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

  const isModelEnabled = (modelName: string): boolean => {
    return preferences.selectedAIModels.includes(modelName);
  };

  return (
    <UserPreferencesContext.Provider value={{ 
      preferences, 
      isLoading, 
      updatePreferences,
      archiveDataset,
      restoreDataset,
      isDatasetArchived,
      updateSelectedUniversityDatasets,
      isModelEnabled
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
