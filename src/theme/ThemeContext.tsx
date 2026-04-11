import React, {createContext, useContext, useEffect, useState, useCallback} from 'react';
import {useColorScheme, Appearance} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {colors, ThemeColors, ColorScheme} from './colors';

const THEME_STORAGE_KEY = '@carrot_theme';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: ColorScheme;
  themeMode: ThemeMode;
  colors: ThemeColors;
  setThemeMode: (mode: ThemeMode) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  themeMode: 'system',
  colors: colors.dark,
  setThemeMode: () => {},
  isDark: true,
});

export function ThemeProvider({children}: {children: React.ReactNode}) {
  const systemScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(THEME_STORAGE_KEY).then(stored => {
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        setThemeModeState(stored);
      }
      setIsLoaded(true);
    });
  }, []);

  const setThemeMode = useCallback((mode: ThemeMode) => {
    setThemeModeState(mode);
    AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
  }, []);

  const systemResolved: ColorScheme = systemScheme === 'light' ? 'light' : 'dark';
  const resolvedTheme: ColorScheme =
    themeMode === 'system' ? systemResolved : themeMode;

  const value: ThemeContextType = {
    theme: resolvedTheme,
    themeMode,
    colors: colors[resolvedTheme],
    setThemeMode,
    isDark: resolvedTheme === 'dark',
  };

  if (!isLoaded) {
    return null;
  }

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
