
/**
 * Represents a user's preferences
 */
export interface UserPreferences {
  /**
   * Whether to show the correct answer immediately after a wrong answer
   */
  immediateFeedback: boolean;
  
  /**
   * Array of dataset filenames that are archived
   */
  archivedDatasets: string[];
  
  /**
   * Whether dark mode is enabled
   */
  darkMode: boolean;
}
