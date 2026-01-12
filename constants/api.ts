// API Configuration
// Change this to your computer's IP address when testing on physical device
export const API_BASE_URL = __DEV__ 
  ? 'http://192.168.1.10:3000/api' 
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
  STOCK_ALLOCATION: '/stock-allocation',
  LOCATIONS_DISTRICTS: '/locations/districts',
  LOCATIONS_DISTRICTS_LIST: '/locations/districts/list',
  LOCATIONS_TALUKAS: '/locations/districts',
  LOCATIONS_SEARCH: '/locations/search',
  // Location Allocation Endpoints
  LOCATION_ALLOCATION_ADMIN_ALLOCATE: '/location-allocation/admin/allocate-to-dealer',
  LOCATION_ALLOCATION_ADMIN_DEALER_ALLOCATIONS: '/location-allocation/admin/dealer',
  LOCATION_ALLOCATION_ADMIN_DEALERS_ALLOCATIONS: '/location-allocation/admin/dealers-allocations',
  LOCATION_ALLOCATION_ADMIN_DELETE: '/location-allocation/admin/allocation',
  LOCATION_ALLOCATION_DEALER_MY_ALLOCATIONS: '/location-allocation/dealer/my-allocations',
  LOCATION_ALLOCATION_DEALER_ALLOCATE: '/location-allocation/dealer/allocate-to-salesman',
  LOCATION_ALLOCATION_DEALER_SALESMAN_ALLOCATIONS: '/location-allocation/dealer/salesman',
  LOCATION_ALLOCATION_DEALER_SALESMEN_ALLOCATIONS: '/location-allocation/dealer/salesmen-allocations',
  LOCATION_ALLOCATION_DEALER_DELETE: '/location-allocation/dealer/allocation',
  LOCATION_ALLOCATION_SALESMAN_MY_ALLOCATIONS: '/location-allocation/salesman/my-allocations',
};

