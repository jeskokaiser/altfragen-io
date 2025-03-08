
/**
 * Theme context type definition
 */
export interface ThemeContextType {
  /**
   * Current theme
   */
  theme: 'light' | 'dark';
  
  /**
   * Toggles between light and dark theme
   */
  toggleTheme: () => void;
}
