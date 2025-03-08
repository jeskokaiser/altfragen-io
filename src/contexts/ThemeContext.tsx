
import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { ThemeContextType } from '@/types/contexts/ThemeContextType';

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  toggleTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const savedTheme = localStorage.getItem('theme');
    return (savedTheme as 'light' | 'dark') || 'light';
  });
  
  const location = useLocation();
  const isLandingPage = location.pathname === '/';

  useEffect(() => {
    if (isLandingPage) {
      document.documentElement.classList.remove('dark');
    } else {
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [theme, isLandingPage]);

  // Memoize the toggle function
  const toggleTheme = useCallback(() => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  }, [theme]);

  // Memoize the context value
  const contextValue = useMemo(() => ({ 
    theme, 
    toggleTheme 
  }), [theme, toggleTheme]);

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};
