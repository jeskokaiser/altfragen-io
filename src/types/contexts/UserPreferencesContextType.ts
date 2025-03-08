
import { UserPreferences } from '../models/UserPreferences';

/**
 * User preferences context type definition
 */
export interface UserPreferencesContextType {
  /**
   * User preferences state
   */
  preferences: UserPreferences;
  
  /**
   * Loading state while fetching preferences
   */
  isLoading: boolean;
  
  /**
   * Updates user preferences
   */
  updatePreferences: (newPreferences: Partial<UserPreferences>) => Promise<void>;
  
  /**
   * Archives a dataset
   */
  archiveDataset: (filename: string) => Promise<void>;
  
  /**
   * Restores an archived dataset
   */
  restoreDataset: (filename: string) => Promise<void>;
  
  /**
   * Checks if a dataset is archived
   */
  isDatasetArchived: (filename: string) => boolean;
}
