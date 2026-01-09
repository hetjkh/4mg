import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL, API_ENDPOINTS } from '@/constants/api';

const TOKEN_KEY = 'auth_token';

export interface DealerStock {
  product: {
    id: string;
    title: string;
    packetPrice: number;
    packetsPerStrip: number;
    image: string;
  };
  totalStrips: number;
  allocatedStrips: number;
  availableStrips: number;
  sources: Array<{
    id: string;
    strips: number;
    allocated: number;
    available: number;
    sourceRequest?: {
      strips: number;
      requestedAt: string;
    };
    createdAt: string;
  }>;
}

export interface Salesman {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface StockAllocation {
  id: string;
  salesman: {
    id: string;
    name: string;
    email: string;
  };
  product: {
    id: string;
    title: string;
    packetPrice: number;
    packetsPerStrip: number;
    image: string;
  };
  strips: number;
  notes?: string;
  createdAt: string;
}

export interface DealerAllocations {
  salesman: {
    id: string;
    name: string;
    email: string;
  };
  allocations: Array<{
    id: string;
    product: {
      id: string;
      title: string;
      packetPrice: number;
      packetsPerStrip: number;
      image: string;
    };
    strips: number;
    notes?: string;
    createdAt: string;
  }>;
  totalStrips: number;
}

export interface SalesmanStock {
  product: {
    id: string;
    title: string;
    packetPrice: number;
    packetsPerStrip: number;
    image: string;
  };
  totalStrips: number;
  allocations: Array<{
    id: string;
    strips: number;
    dealer: {
      id: string;
      name: string;
      email: string;
    };
    notes?: string;
    allocatedAt: string;
  }>;
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

// Get Dealer Stock
export const getDealerStock = async (): Promise<DealerStock[]> => {
  try {
    const token = await getToken();
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.STOCK_ALLOCATION}/dealer/stock`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch dealer stock');
    }

    return data.data.stocks || [];
  } catch (error: any) {
    console.error('Get dealer stock error:', error);
    if (error.message?.includes('Network request failed') || error.message?.includes('Failed to fetch')) {
      throw new Error('Cannot connect to server. Please check your connection.');
    }
    throw error;
  }
};

// Get Salesmen for Allocation
export const getDealerSalesmen = async (): Promise<Salesman[]> => {
  try {
    const token = await getToken();
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.STOCK_ALLOCATION}/dealer/salesmen`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch salesmen');
    }

    return data.data.salesmen || [];
  } catch (error: any) {
    console.error('Get salesmen error:', error);
    if (error.message?.includes('Network request failed') || error.message?.includes('Failed to fetch')) {
      throw new Error('Cannot connect to server. Please check your connection.');
    }
    throw error;
  }
};

// Allocate Stock to Salesman
export const allocateStock = async (
  salesmanId: string,
  productId: string,
  strips: number,
  notes?: string
): Promise<{ success: boolean; message: string; data: { allocation: StockAllocation; totalAllocated: number } }> => {
  try {
    const token = await getToken();
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.STOCK_ALLOCATION}/allocate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ salesmanId, productId, strips, notes }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to allocate stock');
    }

    return data;
  } catch (error: any) {
    console.error('Allocate stock error:', error);
    if (error.message?.includes('Network request failed') || error.message?.includes('Failed to fetch')) {
      throw new Error('Cannot connect to server. Please check your connection.');
    }
    throw error;
  }
};

// Get Dealer Allocations
export const getDealerAllocations = async (): Promise<DealerAllocations[]> => {
  try {
    const token = await getToken();
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.STOCK_ALLOCATION}/dealer/allocations`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch allocations');
    }

    return data.data.allocations || [];
  } catch (error: any) {
    console.error('Get dealer allocations error:', error);
    if (error.message?.includes('Network request failed') || error.message?.includes('Failed to fetch')) {
      throw new Error('Cannot connect to server. Please check your connection.');
    }
    throw error;
  }
};

// Get Salesman Stock
export const getSalesmanStock = async (): Promise<SalesmanStock[]> => {
  try {
    const token = await getToken();
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.STOCK_ALLOCATION}/salesman/stock`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch salesman stock');
    }

    return data.data.stocks || [];
  } catch (error: any) {
    console.error('Get salesman stock error:', error);
    if (error.message?.includes('Network request failed') || error.message?.includes('Failed to fetch')) {
      throw new Error('Cannot connect to server. Please check your connection.');
    }
    throw error;
  }
};

