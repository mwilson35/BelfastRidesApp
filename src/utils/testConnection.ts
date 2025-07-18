// Quick Backend Connection Test
// Run this in a React Native component to test your backend connection

import { API_CONFIG, buildApiUrl } from '../config/api';

export const testBackendConnection = async () => {
  console.log('🔗 Testing backend connection...');
  console.log('Backend URL:', API_CONFIG.BASE_URL);
  
  try {
    // Since driver endpoints work, test the actual driver status endpoint
    const response = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.DRIVER_STATUS), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
        // Note: This will fail without auth, but that means the endpoint is reachable
      }
    });
    
    // Even if we get 401 (unauthorized), it means backend is reachable
    if (response.status === 401 || response.status === 403) {
      console.log('✅ Backend connection successful! (Authentication required)');
      console.log('✅ Server is running on port 5000');
      console.log('✅ Driver endpoints are accessible');
      return true;
    } else if (response.ok) {
      console.log('✅ Backend connection successful!');
      console.log('✅ Server is running on port 5000');
      return true;
    } else {
      console.log('✅ Backend reachable but returned:', response.status);
      return true; // Still reachable
    }
  } catch (error) {
    console.log('❌ Backend connection failed:', error);
    console.log('📱 But driver endpoints seem to work, so check:');
    console.log('  1. Network connectivity between test and driver calls');
    console.log('  2. CORS settings for different request types');
    console.log('  3. Backend may be blocking unauthorized requests');
    return false;
  }
};

// Test driver endpoints specifically
export const testDriverEndpoints = async (driverToken: string) => {
  console.log('🚗 Testing driver endpoints...');
  
  const endpoints = [
    { name: 'Driver Status', url: buildApiUrl(API_CONFIG.ENDPOINTS.DRIVER_STATUS) },
    { name: 'Driver Location', url: buildApiUrl(API_CONFIG.ENDPOINTS.DRIVER_LOCATION) },
    { name: 'Active Ride', url: buildApiUrl(API_CONFIG.ENDPOINTS.DRIVER_ACTIVE_RIDE) }
  ];
  
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint.url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${driverToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        console.log(`✅ ${endpoint.name}: Connected`);
      } else {
        console.log(`❌ ${endpoint.name}: Error ${response.status}`);
      }
    } catch (error) {
      console.log(`❌ ${endpoint.name}: Connection failed`);
    }
  }
};
