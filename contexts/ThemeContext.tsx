import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';
import { ColorScheme } from '@/constants/colors';
import * as SecureStore from 'expo-secure-store';

const THEME_STORAGE_KEY = 'app_theme';

interface ThemeContextType {
  colorScheme: ColorScheme;
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (theme: ColorScheme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const systemColorScheme = useRNColorScheme();
  const [colorScheme, setColorScheme] = useState<ColorScheme>('dark'); // Default to dark
  const [isInitialized, setIsInitialized] = useState(false);

  // Load saved theme preference on mount
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await SecureStore.getItemAsync(THEME_STORAGE_KEY);
        if (savedTheme === 'light' || savedTheme === 'dark') {
          setColorScheme(savedTheme);
        } else {
          // Use system preference if no saved theme
          setColorScheme(systemColorScheme === 'dark' ? 'dark' : 'light');
        }
      } catch (error) {
        console.error('Error loading theme:', error);
        setColorScheme(systemColorScheme === 'dark' ? 'dark' : 'light');
      } finally {
        setIsInitialized(true);
      }
    };

    loadTheme();
  }, [systemColorScheme]);

  const toggleTheme = async () => {
    const newTheme: ColorScheme = colorScheme === 'dark' ? 'light' : 'dark';
    setColorScheme(newTheme);
    try {
      await SecureStore.setItemAsync(THEME_STORAGE_KEY, newTheme);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  const setTheme = async (theme: ColorScheme) => {
    setColorScheme(theme);
    try {
      await SecureStore.setItemAsync(THEME_STORAGE_KEY, theme);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  const isDark = colorScheme === 'dark';

  if (!isInitialized) {
    return null; // Or a loading indicator
  }

  return (
    <ThemeContext.Provider value={{ colorScheme, isDark, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

