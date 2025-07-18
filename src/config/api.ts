// Backend Configuration
export const API_CONFIG = {
  // Updated to use your local network IP with correct port
  BASE_URL: 'http://192.168.33.5:5000', // Your backend server on port 5000
  
  // Socket.io configuration
  SOCKET_URL: 'http://192.168.33.5:5000', // Same as base URL
  
  // API Endpoints
  ENDPOINTS: {
    // Driver endpoints
    DRIVER_STATUS: '/api/drivers/status',
    DRIVER_LOCATION: '/api/drivers/location',
    DRIVER_ACTIVE_RIDE: '/api/drivers/active-ride',
    DRIVER_RIDE_STATUS: '/api/drivers/ride-status',
    
    // Rider endpoints (existing)
    RIDES: '/api/rides',
    TIPS: '/api/tips',
    
    // Auth endpoints
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
  },
  
  // Location update configuration
  LOCATION_UPDATE_INTERVAL: 5000, // 5 seconds
  LOCATION_DISTANCE_FILTER: 5, // 5 meters
};

// Helper function to build full URL
export const buildApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

// Authentication headers helper
export const getAuthHeaders = (token: string) => ({
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json',
});
