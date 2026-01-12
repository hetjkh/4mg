import * as SecureStore from 'expo-secure-store';

const LANGUAGE_STORAGE_KEY = 'app_language';

/**
 * Get current language from secure storage
 * Used for API Accept-Language header
 */
export const getLanguage = async (): Promise<string> => {
  try {
    const language = await SecureStore.getItemAsync(LANGUAGE_STORAGE_KEY);
    return language === 'gu' || language === 'en' ? language : 'en';
  } catch (error) {
    console.error('Error getting language:', error);
    return 'en';
  }
};

