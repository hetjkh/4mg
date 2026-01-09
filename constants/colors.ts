/**
 * Color constants for the application
 * Supports both light and dark mode
 */

export const Colors = {
  light: {
    // Background colors
    background: '#FFFFFF',
    backgroundSecondary: '#F9FAFB',
    backgroundTertiary: '#F3F4F6',
    cardBackground: '#FFFFFF',
    cardBackgroundSecondary: '#F9FAFB',
    
    // Text colors
    text: '#111827',
    textSecondary: '#6B7280',
    textTertiary: '#9CA3AF',
    textInverse: '#FFFFFF',
    
    // Border colors
    border: '#E5E7EB',
    borderSecondary: '#D1D5DB',
    
    // Primary colors
    primary: '#3B82F6',
    primaryLight: '#60A5FA',
    primaryDark: '#2563EB',
    
    // Secondary colors
    secondary: '#6B7280',
    secondaryLight: '#9CA3AF',
    secondaryDark: '#4B5563',
    
    // Status colors
    success: '#059669',
    successLight: '#10B981',
    error: '#DC2626',
    errorLight: '#EF4444',
    warning: '#D97706',
    info: '#2563EB',
    infoLight: '#60A5FA',
    
    // Role colors
    roleAdmin: '#DC2626',
    roleStalkist: '#059669',
    roleDellear: '#7C3AED',
    roleSalesman: '#2563EB',
    
    // Input colors
    inputBackground: '#F9FAFB',
    inputBorder: '#D1D5DB',
    inputText: '#111827',
    inputPlaceholder: '#9CA3AF',
    
    // Overlay
    overlay: 'rgba(0, 0, 0, 0.5)',
    overlayDark: 'rgba(0, 0, 0, 0.7)',
  },
  dark: {
    // Background colors
    background: '#000000',
    backgroundSecondary: '#1D1D1D',
    backgroundTertiary: '#1F1F1F',
    cardBackground: '#1D1D1D',
    cardBackgroundSecondary: '#1F1F1F',
    
    // Text colors
    text: '#FFFFFF',
    textSecondary: '#D1D5DB',
    textTertiary: '#9CA3AF',
    textInverse: '#111827',
    
    // Border colors
    border: '#374151',
    borderSecondary: '#1F1F1F',
    
    // Primary colors
    primary: '#3B82F6',
    primaryLight: '#60A5FA',
    primaryDark: '#2563EB',
    
    // Secondary colors
    secondary: '#6B7280',
    secondaryLight: '#9CA3AF',
    secondaryDark: '#4B5563',
    
    // Status colors
    success: '#059669',
    successLight: '#10B981',
    error: '#DC2626',
    errorLight: '#EF4444',
    warning: '#D97706',
    info: '#2563EB',
    infoLight: '#60A5FA',
    
    // Role colors
    roleAdmin: '#DC2626',
    roleStalkist: '#059669',
    roleDellear: '#7C3AED',
    roleSalesman: '#2563EB',
    
    // Input colors
    inputBackground: '#D1D5DB',
    inputBorder: '#9CA3AF',
    inputText: '#111827',
    inputPlaceholder: '#9CA3AF',
    
    // Overlay
    overlay: 'rgba(0, 0, 0, 0.5)',
    overlayDark: 'rgba(0, 0, 0, 0.7)',
  },
};

export type ColorScheme = 'light' | 'dark';

