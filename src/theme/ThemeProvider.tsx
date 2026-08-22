import { createContext, useContext, useState, ReactNode } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';
import { ColorScheme, ColorPalette, getColors } from './index';

interface ThemeContextType {
  colorScheme: ColorScheme;
  colors: ColorPalette;
  toggleTheme: () => void;
  setTheme: (scheme: ColorScheme) => void;
  getShadow: (size: 'sm' | 'md' | 'lg') => any;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
  defaultScheme?: ColorScheme;
}

export const ThemeProvider = ({
  children,
  defaultScheme = 'light'
}: ThemeProviderProps) => {
  const systemScheme = useRNColorScheme();
  const [colorScheme, setColorScheme] = useState<ColorScheme>(defaultScheme);

  const colors = getColors(colorScheme);

  const toggleTheme = () => {
    setColorScheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const setTheme = (scheme: ColorScheme) => {
    setColorScheme(scheme);
  };

  const getShadow = (size: 'sm' | 'md' | 'lg') => {
    const { getShadow: getShadowFn } = require('./index');
    return getShadowFn(colorScheme, size);
  };

  return (
    <ThemeContext.Provider value={{ colorScheme, colors, toggleTheme, setTheme, getShadow }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useColors = () => {
  const { colors } = useTheme();
  return colors;
};

export const useColorScheme = () => {
  const { colorScheme } = useTheme();
  return colorScheme;
};

export const useShadow = (size: 'sm' | 'md' | 'lg' = 'sm') => {
  const { getShadow } = useTheme();
  return getShadow(size);
};