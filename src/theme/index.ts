// Paleta de Colores Argentina - Marca Pais Argentina (MPA)

export const Colors = {
  celesteInstitucional: '#00C8FF',
  azulInstitucional: '#0096DC',
  blanco: '#FFFFFF',
  amarilloAcento: '#FFC800',
  celesteBandera: '#6CACE4',
  amarilloBandera: '#FFB81C',
  marronBandera: '#7D4016',
  grisClaro: '#E5E5E5',
  grisMedio: '#9E9E9E',
  grisOscuro: '#424242',
  negro: '#0A0A0F',
  negroSuave: '#1A1A2E',
  exito: '#3AAA35',
  error: '#CD1719',
  advertencia: '#EE7203',
  info: '#00C8FF',
} as const;

export type ColorScheme = 'light' | 'dark';

export interface ColorPalette {
  primary: string;
  primaryVariant: string;
  secondary: string;
  background: string;
  surface: string;
  surfaceVariant: string;
  textPrimary: string;
  textSecondary: string;
  textOnPrimary: string;
  border: string;
  divider: string;
  card: string;
  cardHover: string;
  inputBackground: string;
  inputBorder: string;
  inputFocus: string;
  shadow: string;
  overlay: string;
  disabled: string;
  placeholder: string;
}

const lightColors: ColorPalette = {
  primary: '#00C8FF',
  primaryVariant: '#0096DC',
  secondary: '#FFC800',
  background: '#FFFFFF',
  surface: '#F8F9FA',
  surfaceVariant: '#E8EDF2',
  textPrimary: '#0A0A0F',
  textSecondary: '#424242',
  textOnPrimary: '#FFFFFF',
  border: '#E0E0E0',
  divider: '#E8EDF2',
  card: '#FFFFFF',
  cardHover: '#F0F4F8',
  inputBackground: '#FFFFFF',
  inputBorder: '#CCCCCC',
  inputFocus: '#00C8FF',
  shadow: 'rgba(0, 200, 255, 0.15)',
  overlay: 'rgba(10, 10, 15, 0.5)',
  disabled: '#BDBDBD',
  placeholder: '#9E9E9E',
};

const darkColors: ColorPalette = {
  primary: '#00C8FF',
  primaryVariant: '#0096DC',
  secondary: '#E5A000',
  background: '#0A0A0F',
  surface: '#12121A',
  surfaceVariant: '#1E1E2E',
  textPrimary: '#FFFFFF',
  textSecondary: '#B0BEC5',
  textOnPrimary: '#0A0A0F',
  border: '#2C2C3E',
  divider: '#1E1E2E',
  card: '#1A1A2E',
  cardHover: '#22223A',
  inputBackground: '#1E1E2E',
  inputBorder: '#3A3A4E',
  inputFocus: '#00C8FF',
  shadow: 'rgba(0, 200, 255, 0.25)',
  overlay: 'rgba(0, 0, 0, 0.7)',
  disabled: '#546E7A',
  placeholder: '#78909C',
};

export const getColors = (scheme: ColorScheme): ColorPalette => {
  return scheme === 'light' ? lightColors : darkColors;
};

export const getShadow = (scheme: ColorScheme, size: 'sm' | 'md' | 'lg') => {
  const shadows = {
    light: {
      sm: { shadowColor: '#00C8FF', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
      md: { shadowColor: '#00C8FF', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 4 },
      lg: { shadowColor: '#00C8FF', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 16, elevation: 8 },
    },
    dark: {
      sm: { shadowColor: '#000000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 2 },
      md: { shadowColor: '#000000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 4 },
      lg: { shadowColor: '#000000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.5, shadowRadius: 16, elevation: 8 },
    },
  };
  return shadows[scheme][size];
};

export const Gradients = {
  primary: ['#00C8FF', '#0096DC'] as const,
  primaryReverse: ['#0096DC', '#00C8FF'] as const,
  buttonPrimary: ['#00C8FF', '#0096DC'] as const,
  buttonSecondary: ['#FFC800', '#FFB81C'] as const,
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
} as const;

export const BorderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  full: 9999,
} as const;

export const TouchTarget = {
  minHeight: 48,
  minWidth: 48,
  comfortable: 56,
} as const;

// Simple shadow helper (no hooks needed)
const lightShadows = {
  sm: { shadowColor: '#00C8FF', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  md: { shadowColor: '#00C8FF', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 4 },
  lg: { shadowColor: '#00C8FF', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 16, elevation: 8 },
};

const darkShadows = {
  sm: { shadowColor: '#000000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 2 },
  md: { shadowColor: '#000000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 4 },
  lg: { shadowColor: '#000000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.5, shadowRadius: 16, elevation: 8 },
};

// For use in StyleSheet (defaults to light)
export const Shadows = lightShadows;