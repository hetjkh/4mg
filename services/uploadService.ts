import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL, API_ENDPOINTS } from '@/constants/api';

const TOKEN_KEY = 'auth_token';

// Get stored token
const getToken = async (): Promise<string | null> => {
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch (error) {
    console.error('Error getting token:', error);
    return null;
  }
};

// Upload image to Cloudinary via backend
export const uploadImage = async (imageUri: string): Promise<string> => {
  try {
    const token = await getToken();
    if (!token) {
      throw new Error('Not authenticated');
    }

    // Create FormData
    const formData = new FormData();
    
    // Extract filename from URI
    const filename = imageUri.split('/').pop() || 'image.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';

    // Append image file
    formData.append('image', {
      uri: imageUri,
      type: type,
      name: filename,
    } as any);

    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.UPLOAD_IMAGE}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        // Don't set Content-Type, let FormData set it with boundary
      },
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to upload image');
    }

    return data.data.imageUrl;
  } catch (error: any) {
    console.error('Upload image error:', error);
    if (error.message?.includes('Network request failed') || error.message?.includes('Failed to fetch')) {
      throw new Error('Cannot connect to server. Please check your connection.');
    }
    throw error;
  }
};

