/**
 * AlTi Global Design System
 * Converted from Python theme.py to TypeScript
 * Updated with ESG Impact colors (November 2025)
 */

export const ALTI_COLORS = {
  // Core Brand
  primary: '#00f0db',       // Bright turquoise (AlTi signature line)
  secondary: '#00d6c3',     // Darker turquoise
  dark: '#010203',          // Near black
  white: '#ffffff',
  lightTeal: '#E5F5F3',
  midTeal: '#C3E6E3',

  // Grays
  gray: '#757575',
  gray50: '#FAFAFA',
  gray100: '#F5F5F5',
  gray200: '#E5E5E5',
  gray300: '#D4D4D4',
  gray400: '#A3A3A3',
  gray500: '#737373',
  gray600: '#525252',
  gray700: '#404040',
  gray800: '#262626',
  gray900: '#171717',
  lightGray: '#f2f2f2',
  darkGray: '#1f1f1f',

  // ESG Impact Green (sustainability theme)
  emerald: '#10B981',
  emeraldDark: '#059669',
  emeraldDeep: '#047857',
  emeraldLight: '#D1FAE5',
  emeraldSubtle: '#ECFDF5',

  // Semantic
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
} as const;

export const FONT_FAMILY = {
  heading: 'Georgia, "Times New Roman", serif',
  body: 'Inter, AktivGrotesk, Arial, sans-serif',
} as const;

export const FONT_SIZE = {
  xs: '11px',
  sm: '13px',
  base: '15px',
  md: '17px',
  lg: '26px',
  xl: '38px',
  xxl: '48px',
} as const;

export const FONT_WEIGHT = {
  light: '300',
  normal: '400',
  medium: '500',
  semibold: '600',
} as const;

export const SPACING = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  xxl: '40px',
  section: '64px',
} as const;

export const CONTAINER = {
  maxWidth: '1600px',
  padding: '50px',
} as const;

export const BORDER = {
  subtle: `1px solid ${ALTI_COLORS.midTeal}`,
  accent: `3px solid ${ALTI_COLORS.primary}`,
  accentGray: `3px solid ${ALTI_COLORS.gray}`,
  radius: '4px',
  radiusPill: '100px',
} as const;

export const SHADOW = {
  subtle: '0 2px 8px rgba(1, 2, 3, 0.06)',
  card: '0 4px 12px rgba(0, 0, 0, 0.08)',
} as const;

export const TRANSITION = {
  default: 'all 0.3s ease',
  fast: 'all 0.15s ease',
} as const;
