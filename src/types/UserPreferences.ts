
/**
 * User preferences for the application
 */
export interface UserPreferences {
  /**
   * Whether to show feedback immediately after answering a question
   */
  immediateFeedback: boolean;
  
  /**
   * List of datasets that the user has archived
   */
  archivedDatasets: string[];
}
