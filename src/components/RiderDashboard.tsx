import React, { useState } from 'react';
import { View, Text, StyleSheet, Button, TextInput, Keyboard, ActivityIndicator, Alert } from 'react-native';
import MapScreen from './MapScreen';
import axios from 'axios';
import { useRideStore } from '../store/useRideStore';
import { useRoute, useFocusEffect } from '@react-navigation/native';
import { TouchableOpacity, Modal, Pressable } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';




type Props = {
  logout: () => void;
  token: string;
};



const requestRide = async (pickupLocation: string, destination: string, token: string | null) => {

  const response = await axios.post(
    'http://192.168.33.3:5000/api/rides/request',
    { pickupLocation, destination },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
};
const RiderDashboard: React.FC<Props> = ({ logout, token }) => {
  const [menuVisible, setMenuVisible] = useState(false);

  const route = useRoute();

  const [pickupLocation, setPickupLocation] = useState('');
  const [destination, setDestination] = useState('');
  const { preview, setPreview, requestedRide, setRequestedRide } = useRideStore();
const [mapKey, setMapKey] = useState(0);


  const [loading, setLoading] = useState(false);
  const [requestLoading, setRequestLoading] = useState(false); // <-- ADDED STATE

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
      const response = await fetch('http://192.168.33.3:5000/api/rides/preview', {
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
      'http://192.168.33.3:5000/api/rides/cancel',
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
<View style={styles.headerRow}>
  <TouchableOpacity onPress={() => setMenuVisible(true)}>
    <MaterialIcons name="more-vert" size={28} color="#333" />
  </TouchableOpacity>
</View>
<Modal
  visible={menuVisible}
  transparent
  animationType="fade"
  onRequestClose={() => setMenuVisible(false)}
>
  <Pressable style={styles.modalOverlay} onPress={() => setMenuVisible(false)}>
    <View style={styles.menuBox}>
      <Pressable
        onPress={() => {
          setMenuVisible(false);
          logout();
        }}
        style={styles.menuItem}
      >
        <MaterialIcons name="logout" size={20} color="#f33" />
        <Text style={{ marginLeft: 12 }}>Logout</Text>
      </Pressable>
    </View>
  </Pressable>
</Modal>


      <View style={styles.inputBox}>
        <TextInput
          style={styles.input}
          placeholder="Pickup location"
          value={pickupLocation}
          onChangeText={setPickupLocation}
        />
        <TextInput
          style={styles.input}
          placeholder="Destination"
          value={destination}
          onChangeText={setDestination}
        />
        <View style={styles.buttonRow}>
          <Button title="Preview Ride" onPress={handlePreviewRide} />
          {preview && <Button title="Clear Preview" onPress={handleClearPreview} color="#f77" />}
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

{requestedRide && (
  <View style={styles.previewBox}>
    <Text style={styles.previewTitle}>Ride Requested Successfully!</Text>
    <Text>Distance: {requestedRide.distance}</Text>
    <Text>Duration: {requestedRide.duration}</Text>
    <Text>Fare: {requestedRide.estimatedFare}</Text>

    {/* Cancel Button with Confirmation */}
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
  </View>
)}


<View style={styles.mapContainer}>
<MapScreen key={mapKey} encodedPolyline={(requestedRide || preview)?.encodedPolyline} />
</View>

    </View>
  );
};

import styles from '../../css/RiderDashboard.styles';





export default RiderDashboard;


