import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL, API_ENDPOINTS } from '@/constants/api';

const TOKEN_KEY = 'auth_token';

export interface DealerRequest {
  id: string;
  dealer: {
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
    stock: number;
  };
  strips: number;
  status: 'pending' | 'approved' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'verified' | 'rejected';
  receiptImage?: string | null;
  paymentVerifiedBy?: {
    id: string;
    name: string;
    email: string;
  } | null;
  paymentVerifiedAt?: string | null;
  paymentNotes?: string;
  requestedAt: string;
  processedBy?: {
    id: string;
    name: string;
    email: string;
  };
  processedAt?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface DealerRequestResponse {
  success: boolean;
  message: string;
  data: {
    request?: DealerRequest;
    requests?: DealerRequest[];
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

// Create Dealer Request
export const createDealerRequest = async (
  productId: string,
  strips: number
): Promise<DealerRequestResponse> => {
  try {
    const token = await getToken();
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.DEALER_REQUESTS}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ productId, strips }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to create request');
    }

    return data;
  } catch (error: any) {
    console.error('Create dealer request error:', error);
    if (error.message?.includes('Network request failed') || error.message?.includes('Failed to fetch')) {
      throw new Error('Cannot connect to server. Please check your connection.');
    }
    throw error;
  }
};

// Get All Dealer Requests
export const getDealerRequests = async (): Promise<DealerRequest[]> => {
  try {
    const token = await getToken();
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.DEALER_REQUESTS}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch requests');
    }

    return data.data.requests || [];
  } catch (error: any) {
    console.error('Get dealer requests error:', error);
    if (error.message?.includes('Network request failed') || error.message?.includes('Failed to fetch')) {
      throw new Error('Cannot connect to server. Please check your connection.');
    }
    throw error;
  }
};

// Get Single Dealer Request
export const getDealerRequest = async (id: string): Promise<DealerRequest> => {
  try {
    const token = await getToken();
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.DEALER_REQUESTS}/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch request');
    }

    return data.data.request;
  } catch (error: any) {
    console.error('Get dealer request error:', error);
    if (error.message?.includes('Network request failed') || error.message?.includes('Failed to fetch')) {
      throw new Error('Cannot connect to server. Please check your connection.');
    }
    throw error;
  }
};

// Approve Request (Admin only)
export const approveDealerRequest = async (
  id: string,
  notes?: string
): Promise<DealerRequestResponse> => {
  try {
    const token = await getToken();
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.DEALER_REQUESTS}/${id}/approve`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ notes }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to approve request');
    }

    return data;
  } catch (error: any) {
    console.error('Approve dealer request error:', error);
    if (error.message?.includes('Network request failed') || error.message?.includes('Failed to fetch')) {
      throw new Error('Cannot connect to server. Please check your connection.');
    }
    throw error;
  }
};

// Cancel Request (Admin only)
export const cancelDealerRequest = async (
  id: string,
  notes?: string
): Promise<DealerRequestResponse> => {
  try {
    const token = await getToken();
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.DEALER_REQUESTS}/${id}/cancel`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ notes }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to cancel request');
    }

    return data;
  } catch (error: any) {
    console.error('Cancel dealer request error:', error);
    if (error.message?.includes('Network request failed') || error.message?.includes('Failed to fetch')) {
      throw new Error('Cannot connect to server. Please check your connection.');
    }
    throw error;
  }
};

// Get Dealer Statistics (for Stalkist)
export interface DealerStats {
  dealer: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  stats: {
    totalRequests: number;
    pendingRequests: number;
    approvedRequests: number;
    cancelledRequests: number;
    totalStripsRequested: number;
    totalStripsApproved: number;
    totalStripsPending: number;
    totalValueRequested: string;
    totalValueApproved: string;
  };
  requests: Array<{
    id: string;
    product: {
      id: string;
      title: string;
      packetPrice: number;
      packetsPerStrip: number;
    };
    strips: number;
    status: string;
    requestedAt: string;
    processedAt?: string;
    totalValue: string;
  }>;
}

export const getDealerStats = async (dealerId: string): Promise<DealerStats> => {
  try {
    const token = await getToken();
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.DEALER_REQUESTS}/dealer/${dealerId}/stats`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    // Check if response is actually JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error('Non-JSON response:', text.substring(0, 200));
      throw new Error(`Server returned non-JSON response. Status: ${response.status}`);
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch dealer statistics');
    }

    return data.data;
  } catch (error: any) {
    console.error('Get dealer stats error:', error);
    if (error.message?.includes('Network request failed') || error.message?.includes('Failed to fetch')) {
      throw new Error('Cannot connect to server. Please check your connection.');
    }
    throw error;
  }
};

// Get UPI ID
export const getUpiId = async (): Promise<string> => {
  try {
    const token = await getToken();
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.DEALER_REQUESTS}/upi-id`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch UPI ID');
    }

    return data.data.upiId;
  } catch (error: any) {
    console.error('Get UPI ID error:', error);
    if (error.message?.includes('Network request failed') || error.message?.includes('Failed to fetch')) {
      throw new Error('Cannot connect to server. Please check your connection.');
    }
    throw error;
  }
};

// Update UPI ID (Admin only)
export const updateUpiId = async (upiId: string): Promise<{ success: boolean; message: string; data: { upiId: string } }> => {
  try {
    const token = await getToken();
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.DEALER_REQUESTS}/upi-id`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ upiId }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to update UPI ID');
    }

    return data;
  } catch (error: any) {
    console.error('Update UPI ID error:', error);
    if (error.message?.includes('Network request failed') || error.message?.includes('Failed to fetch')) {
      throw new Error('Cannot connect to server. Please check your connection.');
    }
    throw error;
  }
};

// Upload Payment Receipt (Dealer only)
export const uploadReceipt = async (
  requestId: string,
  receiptUri: string
): Promise<DealerRequestResponse> => {
  try {
    if (!requestId || requestId === 'undefined' || requestId.trim() === '') {
      throw new Error('Invalid request ID. Please try again.');
    }

    const token = await getToken();
    if (!token) {
      throw new Error('Not authenticated');
    }

    // Create FormData for file upload
    const formData = new FormData();
    
    // Extract filename from URI
    const filename = receiptUri.split('/').pop() || 'receipt.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';

    // Add file to FormData
    formData.append('receipt', {
      uri: receiptUri,
      name: filename,
      type: type,
    } as any);

    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.DEALER_REQUESTS}/${requestId}/upload-receipt`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        // Don't set Content-Type, let FormData set it with boundary
      },
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to upload receipt');
    }

    return data;
  } catch (error: any) {
    console.error('Upload receipt error:', error);
    if (error.message?.includes('Network request failed') || error.message?.includes('Failed to fetch')) {
      throw new Error('Cannot connect to server. Please check your connection.');
    }
    throw error;
  }
};

// Verify Payment (Admin only)
export const verifyPayment = async (
  requestId: string,
  notes?: string
): Promise<DealerRequestResponse> => {
  try {
    const token = await getToken();
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.DEALER_REQUESTS}/${requestId}/verify-payment`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ notes }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to verify payment');
    }

    return data;
  } catch (error: any) {
    console.error('Verify payment error:', error);
    if (error.message?.includes('Network request failed') || error.message?.includes('Failed to fetch')) {
      throw new Error('Cannot connect to server. Please check your connection.');
    }
    throw error;
  }
};

// Reject Payment (Admin only)
export const rejectPayment = async (
  requestId: string,
  notes?: string
): Promise<DealerRequestResponse> => {
  try {
    const token = await getToken();
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.DEALER_REQUESTS}/${requestId}/reject-payment`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ notes }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to reject payment');
    }

    return data;
  } catch (error: any) {
    console.error('Reject payment error:', error);
    if (error.message?.includes('Network request failed') || error.message?.includes('Failed to fetch')) {
      throw new Error('Cannot connect to server. Please check your connection.');
    }
    throw error;
  }
};

