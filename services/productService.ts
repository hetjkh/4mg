import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL, API_ENDPOINTS } from '@/constants/api';
import { getLanguage } from '@/utils/apiHelpers';

const TOKEN_KEY = 'auth_token';

export interface Product {
  id: string;
  title: string;
  description: string;
  packetPrice: number;
  packetsPerStrip: number;
  image: string;
  stock: number; // Stock in strips
  createdBy?: {
    id: string;
    name: string;
    email: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductResponse {
  success: boolean;
  message: string;
  data: {
    product?: Product;
    products?: Product[];
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

// Get All Products
export const getProducts = async (): Promise<Product[]> => {
  try {
    const token = await getToken();
    const language = await getLanguage();
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.PRODUCTS}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Accept-Language': language,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch products');
    }

    return data.data.products || [];
  } catch (error: any) {
    console.error('Get products error:', error);
    if (error.message?.includes('Network request failed') || error.message?.includes('Failed to fetch')) {
      throw new Error('Cannot connect to server. Please check your connection.');
    }
    throw error;
  }
};

// Get Single Product
export const getProduct = async (id: string): Promise<Product> => {
  try {
    const token = await getToken();
    const language = await getLanguage();
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.PRODUCTS}/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Accept-Language': language,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch product');
    }

    return data.data.product;
  } catch (error: any) {
    console.error('Get product error:', error);
    if (error.message?.includes('Network request failed') || error.message?.includes('Failed to fetch')) {
      throw new Error('Cannot connect to server. Please check your connection.');
    }
    throw error;
  }
};

// Create Product (Admin only)
export const createProduct = async (
  title: string,
  description: string,
  packetPrice: number,
  packetsPerStrip: number,
  image: string,
  stock: number,
  titleGu?: string,
  descriptionGu?: string
): Promise<ProductResponse> => {
  try {
    const token = await getToken();
    if (!token) {
      throw new Error('Not authenticated');
    }

    const language = await getLanguage();
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.PRODUCTS}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Accept-Language': language,
      },
      body: JSON.stringify({ title, description, packetPrice, packetsPerStrip, image, stock, titleGu, descriptionGu }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to create product');
    }

    return data;
  } catch (error: any) {
    console.error('Create product error:', error);
    if (error.message?.includes('Network request failed') || error.message?.includes('Failed to fetch')) {
      throw new Error('Cannot connect to server. Please check your connection.');
    }
    throw error;
  }
};

// Update Product (Admin only)
export const updateProduct = async (
  id: string,
  title: string,
  description: string,
  packetPrice: number,
  packetsPerStrip: number,
  image: string,
  stock: number
): Promise<ProductResponse> => {
  try {
    const token = await getToken();
    if (!token) {
      throw new Error('Not authenticated');
    }

    const language = await getLanguage();
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.PRODUCTS}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Accept-Language': language,
      },
      body: JSON.stringify({ title, description, packetPrice, packetsPerStrip, image, stock }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to update product');
    }

    return data;
  } catch (error: any) {
    console.error('Update product error:', error);
    if (error.message?.includes('Network request failed') || error.message?.includes('Failed to fetch')) {
      throw new Error('Cannot connect to server. Please check your connection.');
    }
    throw error;
  }
};

// Delete Product (Admin only)
export const deleteProduct = async (id: string): Promise<{ success: boolean; message: string }> => {
  try {
    const token = await getToken();
    if (!token) {
      throw new Error('Not authenticated');
    }

    const language = await getLanguage();
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.PRODUCTS}/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Accept-Language': language,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to delete product');
    }

    return data;
  } catch (error: any) {
    console.error('Delete product error:', error);
    if (error.message?.includes('Network request failed') || error.message?.includes('Failed to fetch')) {
      throw new Error('Cannot connect to server. Please check your connection.');
    }
    throw error;
  }
};

