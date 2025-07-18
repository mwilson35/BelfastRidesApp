// Updated test script for Available Rides functionality
// Tests both rider and driver endpoints

const axios = require('axios');

const BASE_URL = 'http://192.168.33.5:5000';

// Test tokens - you'll need to replace these with actual tokens from your system
const RIDER_TOKEN = 'your-rider-jwt-token-here';
const DRIVER_TOKEN = 'your-driver-jwt-token-here';

const testAvailableRidesEndpoint = async () => {
  console.log('🧪 Testing Available Rides Endpoint...');
  console.log('=======================================');

  // Test 1: Rider calling available rides
  console.log('\n1. Testing Rider Available Rides...');
  try {
    const riderResponse = await axios.get(`${BASE_URL}/api/rides/available`, {
      headers: {
        'Authorization': `Bearer ${RIDER_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Rider response status:', riderResponse.status);
    console.log('📦 Rider response structure:', Object.keys(riderResponse.data));
    
    if (riderResponse.data.rides) {
      console.log('✅ Found "rides" array for rider');
      console.log('📊 Number of rides:', riderResponse.data.rides.length);
      
      if (riderResponse.data.rides.length > 0) {
        const sampleRide = riderResponse.data.rides[0];
        console.log('📝 Sample rider ride structure:', Object.keys(sampleRide));
        console.log('📍 Sample ride:', {
          id: sampleRide.id,
          pickup_location: sampleRide.pickup_location,
          destination: sampleRide.destination,
          status: sampleRide.status,
          estimated_fare: sampleRide.estimated_fare
        });
      }
    } else {
      console.log('❌ Missing "rides" array in rider response');
    }
  } catch (error) {
    console.log('❌ Rider test failed:', error.response?.data || error.message);
  }

  // Test 2: Driver calling available rides
  console.log('\n2. Testing Driver Available Rides...');
  try {
    const driverResponse = await axios.get(`${BASE_URL}/api/rides/available`, {
      headers: {
        'Authorization': `Bearer ${DRIVER_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Driver response status:', driverResponse.status);
    console.log('📦 Driver response structure:', Object.keys(driverResponse.data));
    
    if (driverResponse.data.availableRides) {
      console.log('✅ Found "availableRides" array for driver');
      console.log('📊 Number of available rides:', driverResponse.data.availableRides.length);
      
      if (driverResponse.data.availableRides.length > 0) {
        const sampleRide = driverResponse.data.availableRides[0];
        console.log('📝 Sample driver ride structure:', Object.keys(sampleRide));
        console.log('📍 Sample ride:', {
          id: sampleRide.id,
          pickup_location: sampleRide.pickup_location,
          destination: sampleRide.destination,
          rider_name: sampleRide.rider_name,
          estimated_fare: sampleRide.estimated_fare
        });
      }
    } else {
      console.log('❌ Missing "availableRides" array in driver response');
    }
  } catch (error) {
    console.log('❌ Driver test failed:', error.response?.data || error.message);
  }

  // Test 3: Test driver accept ride endpoint
  console.log('\n3. Testing Driver Accept Ride...');
  try {
    // This would be a real ride ID in your system
    const testRideId = 1;
    
    const acceptResponse = await axios.post(`${BASE_URL}/api/drivers/accept-ride`, {
      rideId: testRideId
    }, {
      headers: {
        'Authorization': `Bearer ${DRIVER_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Accept ride response status:', acceptResponse.status);
    console.log('📦 Accept ride response:', acceptResponse.data);
  } catch (error) {
    console.log('❌ Accept ride test failed:', error.response?.data || error.message);
  }

  console.log('\n🏁 Testing completed!');
};

// Helper function to test with manual tokens
const testWithTokens = async (riderToken, driverToken) => {
  if (!riderToken || !driverToken) {
    console.log('❌ Please provide both rider and driver tokens');
    console.log('Usage: testWithTokens("rider-token", "driver-token")');
    return;
  }

  // Temporarily set tokens
  const originalRiderToken = RIDER_TOKEN;
  const originalDriverToken = DRIVER_TOKEN;
  
  RIDER_TOKEN = riderToken;
  DRIVER_TOKEN = driverToken;
  
  await testAvailableRidesEndpoint();
  
  // Restore original tokens
  RIDER_TOKEN = originalRiderToken;
  DRIVER_TOKEN = originalDriverToken;
};

// Test the endpoint structure without authentication (to check if endpoint exists)
const testEndpointExists = async () => {
  console.log('🔍 Testing if endpoint exists...');
  
  try {
    const response = await axios.get(`${BASE_URL}/api/rides/available`);
    console.log('✅ Endpoint exists and responds');
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('✅ Endpoint exists (returns 401 - needs authentication)');
    } else {
      console.log('❌ Endpoint issue:', error.response?.status, error.response?.data || error.message);
    }
  }
};

// Run the tests
if (require.main === module) {
  console.log('🚀 Starting Available Rides Tests...');
  
  // First check if endpoint exists
  testEndpointExists().then(() => {
    console.log('\n⚠️  To run full tests, update RIDER_TOKEN and DRIVER_TOKEN in this file');
    console.log('Or call: testWithTokens("your-rider-token", "your-driver-token")');
  });
}

module.exports = {
  testAvailableRidesEndpoint,
  testWithTokens,
  testEndpointExists
};
