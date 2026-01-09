import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL, API_ENDPOINTS } from '@/constants/api';

const TOKEN_KEY = 'auth_token';

export interface Stalkist {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface DealerWithStats {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt?: string;
  salesmenCount: number;
}

export interface StalkistStats {
  stalkist: Stalkist;
  dealers: DealerWithStats[];
  totalDealers: number;
  totalSalesmen: number;
}

export interface Salesman {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt?: string;
}

export interface DealerSalesmen {
  dealer: {
    id: string;
    name: string;
    email: string;
    role: string;
    createdAt?: string;
  };
  salesmen: Salesman[];
  totalSalesmen: number;
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

// Get All Stalkists
export const getStalkists = async (): Promise<Stalkist[]> => {
  try {
    const token = await getToken();
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.STALKISTS}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error('Non-JSON response:', text.substring(0, 200));
      throw new Error(`Server returned non-JSON response. Status: ${response.status}`);
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch stalkists');
    }

    return data.data.stalkists || [];
  } catch (error: any) {
    console.error('Get stalkists error:', error);
    if (error.message?.includes('Network request failed') || error.message?.includes('Failed to fetch')) {
      throw new Error('Cannot connect to server. Please check your connection.');
    }
    throw error;
  }
};

// Get Stalkist Statistics
export const getStalkistStats = async (stalkistId: string): Promise<StalkistStats> => {
  try {
    const token = await getToken();
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.STALKISTS}/${stalkistId}/stats`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error('Non-JSON response:', text.substring(0, 200));
      throw new Error(`Server returned non-JSON response. Status: ${response.status}`);
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch stalkist statistics');
    }

    return data.data;
  } catch (error: any) {
    console.error('Get stalkist stats error:', error);
    if (error.message?.includes('Network request failed') || error.message?.includes('Failed to fetch')) {
      throw new Error('Cannot connect to server. Please check your connection.');
    }
    throw error;
  }
};

// Get Dealer Salesmen (for Admin or Stalkist)
export const getDealerSalesmen = async (dealerId: string, isAdmin: boolean = false): Promise<DealerSalesmen> => {
  try {
    const token = await getToken();
    if (!token) {
      throw new Error('Not authenticated');
    }

    const endpoint = isAdmin 
      ? `${API_BASE_URL}${API_ENDPOINTS.ADMIN_DEALERS}/${dealerId}/salesmen`
      : `${API_BASE_URL}${API_ENDPOINTS.STALKISTS}/dealer/${dealerId}/salesmen`;

    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error('Non-JSON response:', text.substring(0, 200));
      throw new Error(`Server returned non-JSON response. Status: ${response.status}`);
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch dealer salesmen');
    }

    return data.data;
  } catch (error: any) {
    console.error('Get dealer salesmen error:', error);
    if (error.message?.includes('Network request failed') || error.message?.includes('Failed to fetch')) {
      throw new Error('Cannot connect to server. Please check your connection.');
    }
    throw error;
  }
};

// Get All Dealers (Admin only - includes admin-created dealers)
export interface AdminDealer {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy: {
    id: string;
    name: string;
    email: string;
    role: string;
  } | null;
}

export const getAdminDealers = async (): Promise<AdminDealer[]> => {
  try {
    const token = await getToken();
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.ADMIN_DEALERS}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error('Non-JSON response:', text.substring(0, 200));
      throw new Error(`Server returned non-JSON response. Status: ${response.status}`);
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch dealers');
    }

    return data.data.dealers || [];
  } catch (error: any) {
    console.error('Get admin dealers error:', error);
    if (error.message?.includes('Network request failed') || error.message?.includes('Failed to fetch')) {
      throw new Error('Cannot connect to server. Please check your connection.');
    }
    throw error;
  }
};

