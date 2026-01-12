import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL, API_ENDPOINTS } from '@/constants/api';

const TOKEN_KEY = 'auth_token';

export interface District {
  districtCode: string;
  districtName: string;
  talukas: string[];
}

export interface LocationData {
  state: string;
  districts: District[];
}

// Get stored token
const getToken = async (): Promise<string | null> => {
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch (error) {
    console.error('Error getting token:', error);
    return null;
  }
};

// Get all districts with talukas
export const getDistricts = async (): Promise<LocationData> => {
  try {
    const token = await getToken();
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.LOCATIONS_DISTRICTS}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch districts');
    }

    return data.data;
  } catch (error: any) {
    console.error('Get districts error:', error);
    throw error;
  }
};

// Get districts list (names only)
export const getDistrictsList = async (): Promise<District[]> => {
  try {
    const token = await getToken();
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.LOCATIONS_DISTRICTS_LIST}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch districts list');
    }

    return data.data.districts || [];
  } catch (error: any) {
    console.error('Get districts list error:', error);
    throw error;
  }
};

// Get talukas for a district
export const getTalukas = async (districtCode: string): Promise<string[]> => {
  try {
    const token = await getToken();
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.LOCATIONS_TALUKAS}/${districtCode}/talukas`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch talukas');
    }

    return data.data.talukas || [];
  } catch (error: any) {
    console.error('Get talukas error:', error);
    throw error;
  }
};

