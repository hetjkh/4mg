/**
 * Font constants for the application
 * Uses Poppins font family
 */

export const Fonts = {
  // Font families
  light: 'Poppins-Light',
  regular: 'Poppins-Regular',
  medium: 'Poppins-Medium',
  semiBold: 'Poppins-SemiBold',
  bold: 'Poppins-Bold',
  
  // Font sizes
  sizes: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 28,
    '4xl': 36,
  },
  
  // Line heights
  lineHeights: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
  
  // Letter spacing
  letterSpacing: {
    tight: -0.5,
    normal: 0,
    wide: 0.5,
    wider: 1,
  },
};

// Helper function to get font style object
export const getFontStyle = (
  weight: 'light' | 'regular' | 'medium' | 'semiBold' | 'bold' = 'regular',
  size: keyof typeof Fonts.sizes = 'base',
  lineHeight?: keyof typeof Fonts.lineHeights,
  letterSpacing?: keyof typeof Fonts.letterSpacing
) => {
  return {
    fontFamily: Fonts[weight],
    fontSize: Fonts.sizes[size],
    ...(lineHeight && { lineHeight: Fonts.sizes[size] * Fonts.lineHeights[lineHeight] }),
    ...(letterSpacing && { letterSpacing: Fonts.letterSpacing[letterSpacing] }),
  };
};

