// API Configuration
// Change this to your computer's IP address when testing on physical device
export const API_BASE_URL = __DEV__ 
  ? 'http://172.21.52.192:3000/api' 
  : 'https://your-production-api.com/api';

export const API_ENDPOINTS = {
  REGISTER: '/auth/register',
  LOGIN: '/auth/login',
  VERIFY: '/auth/verify',
  HEALTH: '/health',
  TEST: '/test',
  ADMIN_PASSWORD: '/auth/admin/password',
  ALLOWED_ROLES: '/auth/allowed-roles',
  USER_COUNTS: '/auth/user-counts',
  PRODUCTS: '/products',
  UPLOAD_IMAGE: '/upload/image',
  DEALER_REQUESTS: '/dealer-requests',
  SALESMEN: '/salesmen',
  DEALERS: '/dealers',
  ADMIN_DEALERS: '/admin/dealers',
  ADMIN_USERS: '/admin/users',
  STALKISTS: '/stalkists',
};

