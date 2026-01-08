import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL, API_ENDPOINTS } from '@/constants/api';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'user_data';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'stalkist' | 'dellear' | 'salesman';
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    user: User;
  };
}

// Store token securely
export const storeToken = async (token: string): Promise<void> => {
  try {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  } catch (error) {
    console.error('Error storing token:', error);
    throw error;
  }
};

// Get stored token
export const getToken = async (): Promise<string | null> => {
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch (error) {
    console.error('Error getting token:', error);
    return null;
  }
};

// Remove token
export const removeToken = async (): Promise<void> => {
  try {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
  } catch (error) {
    console.error('Error removing token:', error);
  }
};

// Store user data
export const storeUser = async (user: User): Promise<void> => {
  try {
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
  } catch (error) {
    console.error('Error storing user:', error);
  }
};

// Get stored user data
export const getUser = async (): Promise<User | null> => {
  try {
    const userData = await SecureStore.getItemAsync(USER_KEY);
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error('Error getting user:', error);
    return null;
  }
};

// Get allowed roles for current user
export const getAllowedRoles = async (): Promise<string[]> => {
  try {
    const token = await getToken();
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.ALLOWED_ROLES}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch allowed roles');
    }

    return data.data.allowedRoles || [];
  } catch (error: any) {
    console.error('Get allowed roles error:', error);
    if (error.message?.includes('Network request failed') || error.message?.includes('Failed to fetch')) {
      throw new Error('Cannot connect to server. Please check your connection.');
    }
    throw error;
  }
};

// Register new user (role-based, requires authentication)
export const registerUser = async (
  name: string,
  email: string,
  password: string,
  role: 'admin' | 'stalkist' | 'dellear' | 'salesman'
): Promise<{ success: boolean; message: string; data: { user: User } }> => {
  try {
    const token = await getToken();
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.REGISTER}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ name, email, password, role }),
    });

    const data = await response.json();

    if (!response.ok) {
      const errorMessage = data.message || data.error || 'Registration failed';
      throw new Error(errorMessage);
    }

    return data;
  } catch (error: any) {
    console.error('Register user error:', error);
    if (error.message?.includes('Network request failed') || error.message?.includes('Failed to fetch')) {
      throw new Error('Cannot connect to server. Please check your connection.');
    }
    throw error;
  }
};

// Generate admin password
export const generateAdminPassword = async (): Promise<{ success: boolean; data: { password: string } }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/admin/password`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to generate password');
    }

    return data;
  } catch (error) {
    console.error('Generate password error:', error);
    throw error;
  }
};

// Login user
export const login = async (
  email: string,
  password: string,
  role: 'admin' | 'stalkist' | 'dellear' | 'salesman'
): Promise<AuthResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.LOGIN}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password, role }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Login failed');
    }

    if (data.success && data.data) {
      await storeToken(data.data.token);
      await storeUser(data.data.user);
    }

    return data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

// Verify token
export const verifyToken = async (): Promise<User | null> => {
  try {
    const token = await getToken();
    if (!token) {
      return null;
    }

    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.VERIFY}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      await removeToken();
      return null;
    }

    return data.data.user;
  } catch (error) {
    console.error('Verify token error:', error);
    await removeToken();
    return null;
  }
};

// Logout
export const logout = async (): Promise<void> => {
  await removeToken();
};

// Get user counts by role (Admin only)
export interface UserCounts {
  stalkist: number;
  dellear: number;
  salesman: number;
  admin: number;
  total: number;
}

export const getUserCounts = async (): Promise<UserCounts> => {
  try {
    const token = await getToken();
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.USER_COUNTS}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch user counts');
    }

    return data.data;
  } catch (error: any) {
    console.error('Get user counts error:', error);
    if (error.message?.includes('Network request failed') || error.message?.includes('Failed to fetch')) {
      throw new Error('Cannot connect to server. Please check your connection.');
    }
    throw error;
  }
};

