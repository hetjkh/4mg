import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL, API_ENDPOINTS } from '@/constants/api';

const TOKEN_KEY = 'auth_token';

export interface LocationAllocation {
  id: string;
  allocatedTo: string;
  allocatedBy: string;
  allocationType: 'admin-to-dealer' | 'dealer-to-salesman';
  districtCode: string;
  districtName: string;
  allocationScope: 'full-district' | 'specific-talukas';
  talukas: string[];
  status: 'active' | 'inactive';
  createdAt?: string;
  updatedAt?: string;
}

export interface AllocationRequest {
  dealerId?: string;
  salesmanId?: string;
  districtCode: string;
  allocationScope: 'full-district' | 'specific-talukas';
  talukas?: string[];
}

export interface AllocationResponse {
  success: boolean;
  message: string;
  data: {
    allocation?: LocationAllocation;
    allocations?: LocationAllocation[];
    dealers?: any[];
    salesmen?: any[];
  };
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

// ========== ADMIN FUNCTIONS ==========

// Admin: Allocate district/talukas to dealer
export const allocateToDealer = async (request: AllocationRequest): Promise<AllocationResponse> => {
  try {
    const token = await getToken();
    if (!token) {
      throw new Error('Not authenticated');
    }

    if (!request.dealerId) {
      throw new Error('dealerId is required');
    }

    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.LOCATION_ALLOCATION_ADMIN_ALLOCATE}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        dealerId: request.dealerId,
        districtCode: request.districtCode,
        allocationScope: request.allocationScope,
        talukas: request.talukas || [],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to allocate location');
    }

    return data;
  } catch (error: any) {
    console.error('Allocate to dealer error:', error);
    throw error;
  }
};

// Admin: Get all allocations for a dealer
export const getDealerAllocations = async (dealerId: string): Promise<LocationAllocation[]> => {
  try {
    const token = await getToken();
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.LOCATION_ALLOCATION_ADMIN_DEALER_ALLOCATIONS}/${dealerId}/allocations`, {
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
    throw error;
  }
};

// Admin: Get all dealers with their allocations
export const getAllDealersWithAllocations = async (): Promise<any[]> => {
  try {
    const token = await getToken();
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.LOCATION_ALLOCATION_ADMIN_DEALERS_ALLOCATIONS}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch dealers with allocations');
    }

    return data.data.dealers || [];
  } catch (error: any) {
    console.error('Get dealers with allocations error:', error);
    throw error;
  }
};

// Admin: Remove allocation from dealer
export const removeDealerAllocation = async (allocationId: string): Promise<{ success: boolean; message: string }> => {
  try {
    const token = await getToken();
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.LOCATION_ALLOCATION_ADMIN_DELETE}/${allocationId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to remove allocation');
    }

    return data;
  } catch (error: any) {
    console.error('Remove dealer allocation error:', error);
    throw error;
  }
};

// ========== DEALER FUNCTIONS ==========

// Dealer: Get my allocations (what admin allocated to me)
export const getMyDealerAllocations = async (): Promise<LocationAllocation[]> => {
  try {
    const token = await getToken();
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.LOCATION_ALLOCATION_DEALER_MY_ALLOCATIONS}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch my allocations');
    }

    return data.data.allocations || [];
  } catch (error: any) {
    console.error('Get my dealer allocations error:', error);
    throw error;
  }
};

// Dealer: Allocate district/talukas to salesman
export const allocateToSalesman = async (request: AllocationRequest): Promise<AllocationResponse> => {
  try {
    const token = await getToken();
    if (!token) {
      throw new Error('Not authenticated');
    }

    if (!request.salesmanId) {
      throw new Error('salesmanId is required');
    }

    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.LOCATION_ALLOCATION_DEALER_ALLOCATE}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        salesmanId: request.salesmanId,
        districtCode: request.districtCode,
        allocationScope: request.allocationScope,
        talukas: request.talukas || [],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to allocate location');
    }

    return data;
  } catch (error: any) {
    console.error('Allocate to salesman error:', error);
    throw error;
  }
};

// Dealer: Get all allocations for a salesman
export const getSalesmanAllocations = async (salesmanId: string): Promise<LocationAllocation[]> => {
  try {
    const token = await getToken();
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.LOCATION_ALLOCATION_DEALER_SALESMAN_ALLOCATIONS}/${salesmanId}/allocations`, {
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
    console.error('Get salesman allocations error:', error);
    throw error;
  }
};

// Dealer: Get all salesmen with their allocations
export const getAllSalesmenWithAllocations = async (): Promise<any[]> => {
  try {
    const token = await getToken();
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.LOCATION_ALLOCATION_DEALER_SALESMEN_ALLOCATIONS}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch salesmen with allocations');
    }

    return data.data.salesmen || [];
  } catch (error: any) {
    console.error('Get salesmen with allocations error:', error);
    throw error;
  }
};

// Dealer: Remove allocation from salesman
export const removeSalesmanAllocation = async (allocationId: string): Promise<{ success: boolean; message: string }> => {
  try {
    const token = await getToken();
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.LOCATION_ALLOCATION_DEALER_DELETE}/${allocationId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to remove allocation');
    }

    return data;
  } catch (error: any) {
    console.error('Remove salesman allocation error:', error);
    throw error;
  }
};

// ========== SALESMAN FUNCTIONS ==========

// Salesman: Get my allocations
export const getMySalesmanAllocations = async (): Promise<LocationAllocation[]> => {
  try {
    const token = await getToken();
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.LOCATION_ALLOCATION_SALESMAN_MY_ALLOCATIONS}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch my allocations');
    }

    return data.data.allocations || [];
  } catch (error: any) {
    console.error('Get my salesman allocations error:', error);
    throw error;
  }
};

