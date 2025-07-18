import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Dimensions,
  Modal,
} from 'react-native';

const { width } = Dimensions.get('window');

type RiderRide = {
  id: number;
  pickup_location: string;
  destination: string;
  status: string;
  estimated_fare: number;
  distance: number;
  pickup_lat: number;
  pickup_lng: number;
  destination_lat: number;
  destination_lng: number;
  created_at: string;
};

type DriverRide = {
  id: number;
  pickup_location: string;
  destination: string;
  rider_name: string;
  rider_email: string;
  estimated_fare: number;
  distance: number;
  pickup_lat?: number;
  pickup_lng?: number;
  destination_lat?: number;
  destination_lng?: number;
  created_at: string;
};

type AvailableRide = RiderRide | DriverRide;

type Props = {
  token: string | null;
  onRideAccepted: (ride: any) => void;
  onRoutePreview: (ride: AvailableRide) => void;
  visible: boolean;
  onClose: () => void;
  userRole?: string; // Add userRole to determine which endpoint to use
};

const AvailableRidesList: React.FC<Props> = ({
  token,
  onRideAccepted,
  onRoutePreview,
  visible,
  onClose,
  userRole,
}) => {
  const [rides, setRides] = useState<AvailableRide[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAvailableRides = async () => {
    if (!token) return;

    try {
      setLoading(true);
      const response = await fetch(`http://192.168.33.5:5000/api/rides/available`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch available rides');
      }

      const data = await response.json();
      
      // Debug: Log the actual response to see what we're getting
      console.log('🔍 Available rides API response:', JSON.stringify(data, null, 2));
      
      // Handle different response structures based on user role
      let ridesArray: AvailableRide[] = [];
      
      if (data.rides && Array.isArray(data.rides)) {
        // For riders - response has "rides" array
        ridesArray = data.rides;
        console.log('📱 Using rides array for riders');
      } else if (data.availableRides && Array.isArray(data.availableRides)) {
        // For drivers - response has "availableRides" array
        ridesArray = data.availableRides;
        console.log('🚗 Using availableRides array for drivers');
      } else if (Array.isArray(data)) {
        // Fallback - direct array response
        ridesArray = data;
        console.log('📋 Using direct array response');
      }
      
      // Debug: Log each ride to see the data structure
      ridesArray.forEach((ride, index) => {
        console.log(`🚙 Ride ${index + 1}:`, {
          id: ride.id,
          pickup_location: ride.pickup_location,
          destination: ride.destination,
          estimated_fare: ride.estimated_fare,
          estimated_fare_type: typeof ride.estimated_fare,
          distance: ride.distance,
          distance_type: typeof ride.distance,
          pickup_lat: 'pickup_lat' in ride ? ride.pickup_lat : 'missing',
          pickup_lng: 'pickup_lng' in ride ? ride.pickup_lng : 'missing',
          status: 'status' in ride ? ride.status : 'N/A',
          rider_name: 'rider_name' in ride ? ride.rider_name : 'N/A'
        });
      });
      
      // Filter out any invalid ride objects and ensure they have required fields
      const validRides = ridesArray.filter(ride => 
        ride && 
        typeof ride === 'object' && 
        ride.id && 
        (ride.pickup_location || ride.destination)
      );
      
      console.log(`✅ Valid rides found: ${validRides.length} out of ${ridesArray.length}`);
      setRides(validRides);
    } catch (error) {
      console.error('Error fetching available rides:', error);
      Alert.alert('Error', 'Failed to fetch available rides');
    } finally {
      setLoading(false);
    }
  };

  const acceptRide = async (rideId: number) => {
    if (!token) return;

    // Only drivers can accept rides
    if (!canAcceptRides()) {
      Alert.alert('Error', 'Only drivers can accept rides');
      return;
    }

    try {
      const response = await fetch(`http://192.168.33.5:5000/api/rides/accept`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ rideId }),
      });

      if (!response.ok) {
        throw new Error('Failed to accept ride');
      }

      const data = await response.json();
      Alert.alert('Success', 'Ride accepted!');
      
      // Since the backend only returns { message, rideId }, we need to find the accepted ride
      // from our current list and format it properly for the DriverMapScreen
      const acceptedRide = rides.find(ride => ride.id === rideId);
      if (acceptedRide) {
        // Format the ride data to match what DriverMapScreen expects
        const formattedRide = {
          id: acceptedRide.id,
          pickup: {
            latitude: 'pickup_lat' in acceptedRide ? Number(acceptedRide.pickup_lat) || 54.607868 : 54.607868,
            longitude: 'pickup_lng' in acceptedRide ? Number(acceptedRide.pickup_lng) || -5.926437 : -5.926437,
            title: 'Pickup Location',
            description: acceptedRide.pickup_location || 'Pickup point',
            type: 'pickup' as const
          },
          destination: {
            latitude: 'destination_lat' in acceptedRide ? Number(acceptedRide.destination_lat) || 54.584473 : 54.584473,
            longitude: 'destination_lng' in acceptedRide ? Number(acceptedRide.destination_lng) || -5.933669 : -5.933669,
            title: 'Destination',
            description: acceptedRide.destination || 'Destination point',
            type: 'destination' as const
          },
          status: 'assigned' as const,
          rideId: data.rideId,
          message: data.message
        };
        
        onRideAccepted(formattedRide);
      } else {
        onRideAccepted(data);
      }
      
      onClose();
    } catch (error) {
      console.error('Error accepting ride:', error);
      Alert.alert('Error', 'Failed to accept ride');
    }
  };

  useEffect(() => {
    if (visible) {
      fetchAvailableRides();
    }
  }, [visible, token]);

  // Auto-refresh available rides every 30 seconds when modal is open
  useEffect(() => {
    if (!visible) return;
    
    const interval = setInterval(() => {
      console.log('🔄 Auto-refreshing available rides...');
      fetchAvailableRides();
    }, 30000); // 30 seconds
    
    return () => clearInterval(interval);
  }, [visible, token]);

  // Helper function to check if ride is a rider ride or driver ride
  const isRiderRide = (ride: AvailableRide): ride is RiderRide => {
    return 'status' in ride && 'pickup_lat' in ride;
  };

  // Helper function to get fare from either ride type
  const getFare = (ride: AvailableRide): number => {
    const fare = ride.estimated_fare;
    
    // Handle both string and number formats from database
    if (typeof fare === 'string') {
      const parsed = parseFloat(fare);
      return !isNaN(parsed) ? parsed : 0;
    }
    
    if (typeof fare === 'number' && !isNaN(fare)) {
      return fare;
    }
    
    return 0;
  };

  // Helper function to determine if user can accept rides (drivers only)
  const canAcceptRides = () => {
    return userRole === 'driver';
  };

  const renderRideItem = ({ item: ride }: { item: AvailableRide }) => {
    const isRider = isRiderRide(ride);
    
    return (
      <TouchableOpacity
        style={styles.rideItem}
        onPress={() => canAcceptRides() ? acceptRide(ride.id) : onRoutePreview(ride)}
      >
        <View style={styles.rideHeader}>
          <Text style={styles.pickup}>{ride.pickup_location || 'Unknown pickup'}</Text>
          {!isRider && ('rider_name' in ride || 'username' in ride) && (
            <Text style={styles.riderName}>
              Rider: {('rider_name' in ride ? ride.rider_name : (ride as any).username) || 'Unknown'}
            </Text>
          )}
        </View>
        <Text style={styles.destination}>To: {ride.destination || 'Unknown destination'}</Text>
        <View style={styles.rideFooter}>
          <Text style={styles.fare}>£{getFare(ride).toFixed(2)}</Text>
          <Text style={styles.distance}>{(ride.distance || 0).toFixed(1)}km</Text>
        </View>
        {isRider && 'status' in ride && (
          <Text style={styles.status}>Status: {ride.status || 'Unknown'}</Text>
        )}
        {canAcceptRides() && (
          <Text style={styles.actionHint}>Tap to accept ride</Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <Modal visible={visible} animationType="slide">
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>
            {userRole === 'driver' ? 'Available Rides' : 'Your Rides'}
          </Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeButton}>✕</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={rides}
          renderItem={renderRideItem}
          keyExtractor={(item) => item.id.toString()}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={fetchAvailableRides} />
          }
        />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, backgroundColor: '#fff' },
  title: { fontSize: 20, fontWeight: 'bold' },
  closeButton: { fontSize: 18, color: '#666' },
  rideItem: { backgroundColor: '#fff', padding: 16, marginHorizontal: 16, marginVertical: 8, borderRadius: 8 },
  rideHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  pickup: { fontSize: 16, fontWeight: 'bold', flex: 1 },
  riderName: { fontSize: 12, color: '#666', fontStyle: 'italic' },
  destination: { fontSize: 14, color: '#666', marginTop: 4, marginBottom: 8 },
  rideFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  fare: { fontSize: 18, color: '#28a745', fontWeight: 'bold' },
  distance: { fontSize: 14, color: '#666' },
  status: { fontSize: 12, color: '#007bff', marginTop: 4 },
  actionHint: { fontSize: 12, color: '#007bff', marginTop: 8, fontStyle: 'italic' },
});

export default AvailableRidesList;