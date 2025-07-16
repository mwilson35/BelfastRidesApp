import { Platform } from 'react-native';

// Typography Scale following Material Design principles
export const typography = {
  // Font families
  fontFamily: {
    regular: Platform.select({
      ios: 'System',
      android: 'Roboto',
      default: 'System',
    }),
    medium: Platform.select({
      ios: 'System',
      android: 'Roboto-Medium',
      default: 'System',
    }),
    bold: Platform.select({
      ios: 'System',
      android: 'Roboto-Bold',
      default: 'System',
    }),
  },

  // Font sizes
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
  },

  // Line heights
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },

  // Font weights
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },

  // Text styles (commonly used combinations)
  styles: {
    h1: {
      fontSize: 30,
      fontFamily: Platform.select({
        ios: 'System',
        android: 'Roboto',
        default: 'System',
      }),
      fontWeight: '700' as const,
      lineHeight: 37,
    },
    h2: {
      fontSize: 24,
      fontFamily: Platform.select({
        ios: 'System',
        android: 'Roboto',
        default: 'System',
      }),
      fontWeight: '600' as const,
      lineHeight: 30,
    },
    h3: {
      fontSize: 20,
      fontFamily: Platform.select({
        ios: 'System',
        android: 'Roboto',
        default: 'System',
      }),
      fontWeight: '600' as const,
      lineHeight: 26,
    },
    h4: {
      fontSize: 18,
      fontFamily: Platform.select({
        ios: 'System',
        android: 'Roboto',
        default: 'System',
      }),
      fontWeight: '600' as const,
      lineHeight: 23,
    },
    h5: {
      fontSize: 16,
      fontFamily: Platform.select({
        ios: 'System',
        android: 'Roboto',
        default: 'System',
      }),
      fontWeight: '600' as const,
      lineHeight: 22,
    },
    body: {
      fontSize: 16,
      fontFamily: Platform.select({
        ios: 'System',
        android: 'Roboto',
        default: 'System',
      }),
      fontWeight: '400' as const,
      lineHeight: 24,
    },
    bodyMedium: {
      fontSize: 16,
      fontFamily: Platform.select({
        ios: 'System',
        android: 'Roboto',
        default: 'System',
      }),
      fontWeight: '500' as const,
      lineHeight: 24,
    },
    bodySmall: {
      fontSize: 14,
      fontFamily: Platform.select({
        ios: 'System',
        android: 'Roboto',
        default: 'System',
      }),
      fontWeight: '400' as const,
      lineHeight: 21,
    },
    caption: {
      fontSize: 12,
      fontFamily: Platform.select({
        ios: 'System',
        android: 'Roboto',
        default: 'System',
      }),
      fontWeight: '400' as const,
      lineHeight: 17,
    },
    label: {
      fontSize: 14,
      fontFamily: Platform.select({
        ios: 'System',
        android: 'Roboto',
        default: 'System',
      }),
      fontWeight: '500' as const,
      lineHeight: 19,
    },
    button: {
      fontSize: 16,
      fontFamily: Platform.select({
        ios: 'System',
        android: 'Roboto',
        default: 'System',
      }),
      fontWeight: '600' as const,
      lineHeight: 20,
    },
  },
};

export default typography;
