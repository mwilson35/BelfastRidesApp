import React, { useState, useEffect } from 'react';
import { View, Text, Button, Keyboard, ActivityIndicator, Alert, Modal } from 'react-native';
import { TouchableOpacity, Pressable } from 'react-native';
import { useRoute, useFocusEffect, useNavigation } from '@react-navigation/native';
import { io } from 'socket.io-client';
import axios from 'axios';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import NetInfo from '@react-native-community/netinfo';

import MapScreen from './MapScreen';
import { useRideStore } from '../store/useRideStore';
import RatingModal from './RatingModal';
import LocationAutocompleteInput from './LocationAutocompleteInput';
import DriverDetailsBox from './DriverDetailsBox';
import ChatScreen from './ChatScreen';
import styles from '../../css/RiderDashboard.styles';









type Props = {
  logout: () => void;
  token: string;
};


const socket = io('http://192.168.33.5:5000');

const requestRide = async (pickupLocation: string, destination: string, token: string | null) => {
  const response = await axios.post(
    'http://192.168.33.5:5000/api/rides/request',
    { pickupLocation, destination },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
};
const RiderDashboard: React.FC<Props> = ({ logout, token }) => {
  // State declarations
  const [menuVisible, setMenuVisible] = useState(false);
  const [pickupLocation, setPickupLocation] = useState('');
  const [destination, setDestination] = useState('');
  const [mapKey, setMapKey] = useState(0);
  const [loading, setLoading] = useState(false);
  const [requestLoading, setRequestLoading] = useState(false);
  const [rideStatus, setRideStatus] = useState<'requested' | 'accepted' | 'in_progress' | 'completed' | 'cancelled' | null>(null);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [rateeId, setRateeId] = useState<number | null>(null);
  const [showRideSummary, setShowRideSummary] = useState(false);
  const [driverLocation, setDriverLocation] = useState<{latitude: number, longitude: number} | null>(null);
  const [showChatModal, setShowChatModal] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  
  // Connectivity state
  const [isConnected, setIsConnected] = useState(true);
  const [isReconnecting, setIsReconnecting] = useState(false);

  const navigation = useNavigation();
  const route = useRoute();
  const { preview, setPreview, requestedRide, setRequestedRide, clearAll } = useRideStore();




  useFocusEffect(
    React.useCallback(() => {
      setMapKey((prev) => prev + 1);
    }, [])
  );


  const handlePreviewRide = async () => {
    Keyboard.dismiss();
    if (!pickupLocation || !destination) {
      Alert.alert('Error', 'Please enter both pickup and destination.');
      return;
    }

    if (!isConnected) {
      Alert.alert('No Internet', 'Please check your connection and try again.');
      return;
    }

    setLoading(true);
    setPreview(null);
    try {
      const response = await fetch('http://192.168.33.5:5000/api/rides/preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ pickupLocation, destination })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Preview failed');
      setPreview(data);
    } catch (err: any) {
      if (!isConnected) {
        Alert.alert('Connection Lost', 'Please check your internet connection.');
      } else {
        Alert.alert('Preview Failed', err.message);
      }
    } finally {
      setLoading(false);
    }
  };


const cancelRide = async () => {
  if (!requestedRide?.rideId) {
    Alert.alert('Error', 'No ride to cancel.');
    return;
  }

  if (!isConnected) {
    Alert.alert('No Internet', 'Cannot cancel ride while offline. Please check your connection.');
    return;
  }

  try {
    await axios.post(
      'http://192.168.33.5:5000/api/rides/cancel',
      { rideId: requestedRide.rideId },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    Alert.alert('Ride Cancelled', 'Your ride has been successfully cancelled.');
    handleClearPreview();
    setRideStatus(null);
  } catch (err: any) {
    // Handle token expiration
    if (err.response?.status === 401) {
      Alert.alert('Session Expired', 'Please log in again.', [
        { text: 'OK', onPress: handleLogout }
      ]);
      return;
    }
    // Handle business rule violations (ride already started)
    if (err.response?.status === 400) {
      Alert.alert('Cannot Cancel', err.response?.data?.message || 'This ride cannot be cancelled as it has already started.');
      // Refresh ride status to sync with backend
      setRideStatus('in_progress');
      return;
    }
    if (!isConnected) {
      Alert.alert('Connection Lost', 'Please check your internet connection and try again.');
    } else {
      Alert.alert('Cancel Failed', err.response?.data?.message || err.message);
    }
  }
};



  const handleClearPreview = () => {
    setPreview(null);
    setRequestedRide(null); // <-- CLEAR REQUESTED RIDE TOO
    setPickupLocation('');
    setDestination('');
    setDriverLocation(null); // clear driver location
  };

  // ADDED HANDLE REQUEST RIDE FUNCTION CLEARLY:
  const handleRequestRide = async () => {
    if (!preview) {
      Alert.alert('Error', 'Please preview the ride first.');
      return;
    }

    if (!isConnected) {
      Alert.alert('No Internet', 'Cannot request ride while offline. Please check your connection.');
      return;
    }

    setRequestLoading(true);
    try {
      const data = await requestRide(pickupLocation, destination, token);
      setRequestedRide(data);
    } catch (err: any) {
      // Handle token expiration
      if (err.response?.status === 401) {
        Alert.alert('Session Expired', 'Please log in again.', [
          { text: 'OK', onPress: handleLogout }
        ]);
        return;
      }
      if (!isConnected) {
        Alert.alert('Connection Lost', 'Please check your internet connection and try again.');
      } else {
        Alert.alert('Request Failed', err.response?.data?.message || err.message);
      }
    } finally {
      setRequestLoading(false);
    }
  };

  const handleChatPress = () => {
    setShowChatModal(true);
  };

  const handleLogout = () => {
    // Clean up all ride state
    clearAll();
    setRideStatus(null);
    setDriverLocation(null);
    setShowChatModal(false);
    setShowRatingModal(false);
    setRateeId(null);
    setShowRideSummary(false);
    setMapKey(prev => prev + 1);
    
    // Disconnect socket
    socket.disconnect();
    
    // Call the parent logout function
    logout();
  };

  // Socket connection and event handlers
  useEffect(() => {
    if (!token) return;

    try {
      const payload: any = JSON.parse(atob(token.split('.')[1]));
      const riderId = payload.id;
      if (riderId) {
        setCurrentUserId(riderId);
        
        // Ensure socket is connected before registering
        if (!socket.connected) {
          socket.connect();
        }
        
        socket.emit('registerRider', riderId);
        console.log('📡 registerRider sent for rider ID:', riderId);
        
        // Add a small delay to ensure socket registration, then fetch current ride
        setTimeout(() => {
          fetchCurrentRideStatus();
        }, 1000);
      }
    } catch (err) {
      console.error('Token decode failed:', err);
    }

    socket.on('driverAccepted', (data) => {
      console.log('🎉 driverAccepted event received:', data);
      setRideStatus('accepted');
      Alert.alert('Driver Accepted', `Your driver has accepted the ride.`);
    });

    socket.on('rideStarted', () => {
      console.log('🚕 Ride started');
      setRideStatus('in_progress');
      Alert.alert('Ride Started', 'Your ride is now in progress.');
    });

    socket.on('rideCompleted', (data) => {
      console.log('✅ Ride completed:', data);
      Alert.alert('Ride Completed', `Fare: £${data.fare}`);
      setRideStatus('completed');
      setRateeId(data.driverId);
      setShowRideSummary(true);
    });

    socket.on('driverLocationUpdate', (location) => {
      console.log('📍 Driver location update:', location);
      setDriverLocation(location);
    });

    // Add socket connection event listeners for debugging
    socket.on('connect', () => {
      console.log('🔌 Socket connected, ID:', socket.id);
      const payload: any = JSON.parse(atob(token.split('.')[1]));
      const riderId = payload.id;
      if (riderId) {
        socket.emit('registerRider', riderId);
        console.log('🔄 Re-registered rider after reconnection:', riderId);
      }
    });

    socket.on('disconnect', (reason) => {
      console.log('🔌 Socket disconnected:', reason);
    });

    return () => {
      socket.off('driverAccepted');
      socket.off('rideStarted');
      socket.off('rideCompleted');
      socket.off('driverLocationUpdate');
      socket.off('connect');
      socket.off('disconnect');
    };
  }, [token]);

  // Fetch current ride status from backend
  const fetchCurrentRideStatus = async () => {
    if (!isConnected) {
      console.log('⚠️ Skipping ride status fetch - offline');
      return;
    }
    
    console.log('🔍 Fetching current ride status from backend...');
    
    try {
      const response = await axios.get('http://192.168.33.5:5000/api/rides/current', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.ride) {
        const currentRide = response.data.ride;
        console.log('🎯 Found active ride from backend:', currentRide);
        
        setRequestedRide({
          rideId: currentRide.id || currentRide.rideId,
          distance: currentRide.distance,
          duration: currentRide.duration,
          estimatedFare: currentRide.estimatedFare || currentRide.estimated_fare,
          encodedPolyline: currentRide.encodedPolyline || currentRide.encoded_polyline,
          status: currentRide.status
        });
        
        // Map backend status to frontend status
        switch (currentRide.status) {
          case 'requested':
            setRideStatus('requested');
            console.log('🔄 Synced status: requested');
            break;
          case 'accepted':
            setRideStatus('accepted');
            console.log('🔄 Synced status: accepted');
            // Show driver accepted notification since user missed it
            Alert.alert('Driver Found!', 'A driver has accepted your ride.');
            break;
          case 'in_progress':
          case 'started':
            setRideStatus('in_progress');
            console.log('🔄 Synced status: in_progress');
            Alert.alert('Ride in Progress', 'Your ride is currently in progress.');
            break;
          case 'completed':
            setRideStatus('completed');
            setRateeId(currentRide.driverId || currentRide.driver_id);
            setShowRideSummary(true);
            console.log('🔄 Synced status: completed');
            break;
          default:
            setRideStatus(null);
            console.log('🔄 Synced status: unknown -', currentRide.status);
        }
        
        console.log('✅ Successfully synced ride status from backend:', currentRide.status);
      } else {
        console.log('ℹ️ No active ride found in backend');
      }
    } catch (err: any) {
      // No active ride or error - this is fine for 404
      if (err.response?.status === 404) {
        console.log('ℹ️ No active ride (404) - this is normal');
      } else {
        console.error('❌ Failed to fetch current ride status:', err.response?.status, err.message);
      }
    }
  };

  // Token validation helper
  const isTokenExpired = (token: string): boolean => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp < currentTime;
    } catch {
      return true;
    }
  };

  // Check token on component mount
  useEffect(() => {
    if (token && isTokenExpired(token)) {
      Alert.alert('Session Expired', 'Your session has expired. Please log in again.', [
        { text: 'OK', onPress: handleLogout }
      ]);
    }
  }, []);

  // State persistence functions
  const saveRideState = async () => {
    try {
      const state = {
        rideStatus,
        requestedRide,
        driverLocation,
        pickupLocation,
        destination,
        preview,
        currentUserId,
        rateeId,
        showRideSummary
      };
      // In a real app, you'd use AsyncStorage here
      console.log('💾 Saving ride state:', state);
    } catch (err) {
      console.error('Failed to save state:', err);
    }
  };

  const loadRideState = async () => {
    try {
      // In a real app, you'd load from AsyncStorage here
      console.log('📂 Loading ride state...');
      // For now, we'll skip loading from storage
    } catch (err) {
      console.error('Failed to load state:', err);
    }
  };

  // Socket reconnection helper
  const reconnectSocket = () => {
    if (!isConnected) return;
    
    setIsReconnecting(true);
    socket.disconnect();
    socket.connect();
    
    if (currentUserId) {
      socket.emit('registerRider', currentUserId);
      console.log('🔄 Socket reconnected for rider:', currentUserId);
    }
    
    setTimeout(() => setIsReconnecting(false), 2000);
  };

  // Network connectivity monitoring
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const connected = !!(state.isConnected && state.isInternetReachable);
      
      if (connected !== isConnected) {
        setIsConnected(connected);
        
        if (connected) {
          console.log('🌐 Internet connection restored');
          Alert.alert('Connection Restored', 'You are back online!');
          reconnectSocket();
          // Fetch current ride status when back online
          setTimeout(() => {
            fetchCurrentRideStatus();
          }, 1500);
        } else {
          console.log('📵 Internet connection lost');
          Alert.alert(
            'Connection Lost', 
            'You are offline. The app will continue to work with limited functionality.',
            [{ text: 'OK' }]
          );
        }
      }
    });

    return () => unsubscribe();
  }, [isConnected]);

  // Load state on component mount
  useEffect(() => {
    loadRideState();
  }, []);

  // Save state when critical data changes
  useEffect(() => {
    if (rideStatus || requestedRide) {
      saveRideState();
    }
  }, [rideStatus, requestedRide, driverLocation]);

  // Helper functions
  const handlePostRatingCleanup = () => {
    setShowRatingModal(false);
    setRateeId(null);
    setRideStatus(null);
    setRequestedRide(null);
    setPreview(null);
    setPickupLocation('');
    setDestination('');
    setDriverLocation(null);
    setMapKey(prev => prev + 1);
  };


  return (
    <View style={styles.container}>
      {/* Offline indicator */}
      {!isConnected && (
        <View style={{
          backgroundColor: '#ff6b6b',
          padding: 8,
          alignItems: 'center',
        }}>
          <Text style={{ color: 'white', fontSize: 14, fontWeight: 'bold' }}>
            📵 You are offline
          </Text>
        </View>
      )}

      {/* Reconnecting indicator */}
      {isReconnecting && (
        <View style={{
          backgroundColor: '#ffa500',
          padding: 8,
          alignItems: 'center',
        }}>
          <Text style={{ color: 'white', fontSize: 14, fontWeight: 'bold' }}>
            🔄 Reconnecting...
          </Text>
        </View>
      )}

<View style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }}>
  <TouchableOpacity onPress={() => setMenuVisible(true)}>
    <MaterialIcons name="menu" size={32} color="#333" />
  </TouchableOpacity>
</View>

<Modal
  visible={menuVisible}
  transparent
  animationType="fade"
  onRequestClose={() => setMenuVisible(false)}
>
  <Pressable
    style={{
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.15)',
    }}
    onPress={() => setMenuVisible(false)}
  >
    <View
      style={{
        position: 'absolute',
        top: 55,
        left: 20,
        backgroundColor: '#fff',
        borderRadius: 12,
        elevation: 4,
        minWidth: 180,
        paddingVertical: 12,
        paddingHorizontal: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
      }}
    >
      {/* 👤 Profile */}
      <Pressable
        onPress={() => {
          setMenuVisible(false);
          navigation.navigate('Profile' as never);
        }}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: 8,
        }}
      >
        <MaterialIcons name="person" size={22} color="#333" />
        <Text style={{ marginLeft: 10, fontSize: 16, color: '#333' }}>
          Profile
        </Text>
      </Pressable>

      {/* 🕓 Ride History */}
      <Pressable
        onPress={() => {
          setMenuVisible(false);
          navigation.navigate('RideHistory' as never);
        }}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: 8,
        }}
      >
        <MaterialIcons name="history" size={22} color="#333" />
        <Text style={{ marginLeft: 10, fontSize: 16, color: '#333' }}>
          Ride History
        </Text>
      </Pressable>

      <Pressable
  onPress={() => {
    setMenuVisible(false);
    navigation.navigate('MyScheduledRides' as never);
  }}
  style={{
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  }}
>
  <MaterialIcons name="event-note" size={22} color="#333" />
  <Text style={{ marginLeft: 10, fontSize: 16, color: '#333' }}>
    My Scheduled Rides
  </Text>
</Pressable>


      {/* ✨ Fake Refer Option (for future) */}
      <Pressable
        onPress={() => {
          setMenuVisible(false);
          Alert.alert('Coming Soon', 'This feature is not available yet.');
        }}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: 8,
        }}
      >
        <MaterialIcons name="star-outline" size={22} color="#aaa" />
        <Text style={{ marginLeft: 10, fontSize: 16, color: '#aaa' }}>
          Refer a Friend
        </Text>
      </Pressable>

      {/* 🔚 Logout */}
      <Pressable
        onPress={() => {
          setMenuVisible(false);
          handleLogout();
        }}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: 8,
          marginTop: 8,
        }}
      >
        <MaterialIcons name="logout" size={22} color="#e53e3e" />
        <Text style={{ marginLeft: 10, fontSize: 16, color: '#e53e3e' }}>
          Logout
        </Text>
      </Pressable>
    </View>
  </Pressable>
</Modal>


{/* Inputs shown only before ride request */}
{!requestedRide && !['accepted', 'in_progress', 'completed'].includes(rideStatus || '') && (
  <View style={styles.inputBox}>
    <LocationAutocompleteInput
      label="Pickup location"
      value={pickupLocation}
      onChange={setPickupLocation}
    />
    <LocationAutocompleteInput
      label="Destination"
      value={destination}
      onChange={setDestination}
    />
    <View style={styles.buttonRow}>
      <Button title="Preview Ride" onPress={handlePreviewRide} />
      {preview && (
        <Button title="Clear Preview" onPress={handleClearPreview} color="#f77" />
      )}
    </View>
  </View>
)}

{loading && <ActivityIndicator style={{ margin: 12 }} />}

{/* Ride preview details */}
{preview && !requestedRide && (
  <View style={styles.previewBox}>
    <Text style={styles.previewTitle}>Ride Preview</Text>
    <Text>Distance: {preview.distance}</Text>
    <Text>Duration: {preview.duration}</Text>
    <Text>Fare: {preview.estimatedFare}</Text>
    <Button title="Request Ride" onPress={handleRequestRide} disabled={requestLoading} />
    {requestLoading && <ActivityIndicator style={{ marginTop: 8 }} />}
  </View>
)}

{/* Ride Status Messages */}
{rideStatus === 'accepted' && (
  <View style={styles.statusBox}>
    <Text>🚗 Driver en route...</Text>
  </View>
)}

{rideStatus === 'in_progress' && (
  <View style={styles.statusBox}>
    <Text>🕒 Ride in progress...</Text>
  </View>
)}

{/* Driver Details */}
{rideStatus && ['accepted', 'in_progress'].includes(rideStatus) && requestedRide?.rideId && (
  <DriverDetailsBox 
    rideId={requestedRide.rideId} 
    token={token} 
    onChatPress={handleChatPress}
  />
)}

{/* Completed Ride Summary */}
{rideStatus === 'completed' && showRideSummary && (
  <View style={styles.statusBox}>
    <Text style={{ fontWeight: 'bold', fontSize: 16 }}>✅ Ride Completed!</Text>
    <Text>Distance: {requestedRide?.distance}</Text>
    <Text>Duration: {requestedRide?.duration}</Text>
    <Text>Fare: £{requestedRide?.estimatedFare}</Text>
    <Button
      title="OK"
      onPress={() => {
        setShowRideSummary(false);
        setShowRatingModal(true);
      }}
    />
  </View>
)}

{/* Active Ride Box */}
{requestedRide && rideStatus !== 'completed' && (
  <View style={[styles.previewBox, { position: 'absolute', bottom: 0, width: '100%', zIndex: 5 }]}>
    <Text style={styles.previewTitle}>Ride Requested Successfully!</Text>
    <Text>Distance: {requestedRide.distance}</Text>
    <Text>Duration: {requestedRide.duration}</Text>
    <Text>Fare: {requestedRide.estimatedFare}</Text>
    {/* Only show cancel if ride hasn't started (backend will enforce this too) */}
    {rideStatus !== 'in_progress' && requestedRide.status !== 'in_progress' && requestedRide.status !== 'started' && (
      <Button
        title="Cancel Ride"
        color="#f33"
        onPress={() => {
          Alert.alert('Cancel Ride?', 'Are you sure?', [
            { text: 'No', style: 'cancel' },
            { text: 'Yes, Cancel', style: 'destructive', onPress: cancelRide },
          ]);
        }}
      />
    )}
  </View>
)}

{/* Map View */}
<View style={{ flex: 1, marginTop: 8 }}>
  <MapScreen key={mapKey} encodedPolyline={(requestedRide || preview)?.encodedPolyline} driverLocation={driverLocation} />
</View>

{/* Rating Modal */}
{showRatingModal && rateeId && (
  <RatingModal
    rideId={requestedRide?.rideId}
    rateeId={rateeId}
    visible={showRatingModal}
    token={token}
    onClose={() => setShowRatingModal(false)}
    onSubmitted={handlePostRatingCleanup}
  />
)}

{/* Chat Modal */}
{showChatModal && requestedRide?.rideId && currentUserId && (
  <Modal
    visible={showChatModal}
    animationType="slide"
    presentationStyle="fullScreen"
    onRequestClose={() => setShowChatModal(false)}
  >
    <ChatScreen
      rideId={requestedRide.rideId}
      token={token}
      currentUserId={currentUserId}
      currentUserType="rider"
      onClose={() => setShowChatModal(false)}
    />
  </Modal>
)}
    </View>
  );
};

export default RiderDashboard;


