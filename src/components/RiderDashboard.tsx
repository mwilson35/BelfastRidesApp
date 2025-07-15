import React, { useState } from 'react';
import { View, Text, StyleSheet, Button, TextInput, Keyboard, ActivityIndicator, Alert } from 'react-native';
import MapScreen from './MapScreen';
import axios from 'axios';
import { useRideStore } from '../store/useRideStore';
import { useRoute, useFocusEffect } from '@react-navigation/native';
import { TouchableOpacity, Modal, Pressable } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { io } from 'socket.io-client';
import { useEffect } from 'react';
import RatingModal from './RatingModal';
import LocationAutocompleteInput from './LocationAutocompleteInput'; // at top if not already
import DriverDetailsBox from './DriverDetailsBox';








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
  useEffect(() => {
    if (!token) return;

    try {
      const payload: any = JSON.parse(atob(token.split('.')[1]));
      const riderId = payload.id;
      if (riderId) {
        socket.emit('registerRider', riderId);
        console.log('📡 registerRider sent for', riderId);
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
setShowRideSummary(true); // 👈 This replaces the modal trigger

});




return () => {
  socket.off('driverAccepted');
  socket.off('rideStarted');
  socket.off('rideCompleted');
};

  }, [token]);

  const handlePostRatingCleanup = () => {
  setShowRatingModal(false);
  setRateeId(null);
  setRideStatus(null);
  setRequestedRide(null);
  setPreview(null);
  setPickupLocation('');
  setDestination('');
  setMapKey(prev => prev + 1); // clear map route
};

  
  const [menuVisible, setMenuVisible] = useState(false);

  const navigation = useNavigation(); // 👈 THIS IS THE ONE

  const route = useRoute();
  const [pickupLocation, setPickupLocation] = useState('');
  const [destination, setDestination] = useState('');
  const { preview, setPreview, requestedRide, setRequestedRide } = useRideStore();
  const [mapKey, setMapKey] = useState(0);
  const [loading, setLoading] = useState(false);
  const [requestLoading, setRequestLoading] = useState(false);
  const [rideStatus, setRideStatus] = useState<'requested' | 'accepted' | 'in_progress' | 'completed' | 'cancelled' | null>(null);
  const [showRatingModal, setShowRatingModal] = useState(false);
const [rateeId, setRateeId] = useState<number | null>(null);
const [showRideSummary, setShowRideSummary] = useState(false);




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
      Alert.alert('Preview Failed', err.message);
    } finally {
      setLoading(false);
    }
  };


  const cancelRide = async () => {
  if (!requestedRide?.rideId) {
    Alert.alert('Error', 'No ride to cancel.');
    return;
  }

  try {
    await axios.post(
      'http://192.168.33.5:5000/api/rides/cancel',
      { rideId: requestedRide.rideId },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    Alert.alert('Ride Cancelled', 'Your ride has been successfully cancelled.');
    handleClearPreview(); // 💥 this clears preview, requestedRide, inputs
  } catch (err: any) {
    Alert.alert('Cancel Failed', err.response?.data?.message || err.message);
  }
};


  const handleClearPreview = () => {
    setPreview(null);
    setRequestedRide(null); // <-- CLEAR REQUESTED RIDE TOO
    setPickupLocation('');
    setDestination('');
  };

  // ADDED HANDLE REQUEST RIDE FUNCTION CLEARLY:
  const handleRequestRide = async () => {
    if (!preview) {
      Alert.alert('Error', 'Please preview the ride first.');
      return;
    }
    setRequestLoading(true);
    try {
      const data = await requestRide(pickupLocation, destination, token);
      setRequestedRide(data);
    } catch (err: any) {
      Alert.alert('Request Failed', err.response?.data?.message || err.message);
    } finally {
      setRequestLoading(false);
    }
  };

  return (
    <View style={styles.container}>
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
          logout();
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
{preview && !requestedRide && !['accepted', 'in_progress'].includes(rideStatus || '') && (
  <Button title="Clear Preview" onPress={handleClearPreview} color="#f77" />
)}
        </View>
      </View>

      {loading && <ActivityIndicator style={{ margin: 12 }} />}

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
{rideStatus && ['accepted', 'in_progress', 'completed'].includes(rideStatus) && requestedRide?.rideId && (
  <DriverDetailsBox rideId={requestedRide.rideId} token={token} />
)}


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



{requestedRide && (
  <View style={styles.previewBox}>
    <Text style={styles.previewTitle}>Ride Requested Successfully!</Text>
    <Text>Distance: {requestedRide.distance}</Text>
    <Text>Duration: {requestedRide.duration}</Text>
    <Text>Fare: {requestedRide.estimatedFare}</Text>

    {rideStatus !== 'in_progress' && rideStatus !== 'completed' && (
      <Button
        title="Cancel Ride"
        color="#f33"
        onPress={() => {
          Alert.alert(
            'Cancel Ride?',
            'Are you sure you want to cancel this ride?',
            [
              { text: 'No', style: 'cancel' },
              { text: 'Yes, Cancel', style: 'destructive', onPress: cancelRide }
            ]
          );
        }}
      />
    )}
  </View>
)}




<View style={styles.mapContainer}>
<MapScreen key={mapKey} encodedPolyline={(requestedRide || preview)?.encodedPolyline} />
</View>
{showRatingModal && rateeId && (
<RatingModal
  rideId={requestedRide?.rideId}
  rateeId={rateeId}
  visible={showRatingModal}
  token={token}
  onClose={() => setShowRatingModal(false)}
  onSubmitted={handlePostRatingCleanup} // ✅ match the prop name
/>

)}

    </View>
  );
};

import styles from '../../css/RiderDashboard.styles';





export default RiderDashboard;


