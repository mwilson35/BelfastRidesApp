import React, { useState } from 'react';
import { View, Text, StyleSheet, Button, TextInput, Keyboard, ActivityIndicator, Alert } from 'react-native';
import MapScreen from './MapScreen';
import axios from 'axios';

type Props = {
  logout: () => void;
  token: string | null;
};

const requestRide = async (pickupLocation: string, destination: string, token: string | null) => {

  const response = await axios.post(
    'http://192.168.33.6:5000/api/rides/request',
    { pickupLocation, destination },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
};

const RiderDashboard: React.FC<Props> = ({ logout, token }) => {
  const [pickupLocation, setPickupLocation] = useState('');
  const [destination, setDestination] = useState('');
  const [preview, setPreview] = useState<any>(null);
  const [requestedRide, setRequestedRide] = useState<any>(null); // <-- ADDED STATE
  const [loading, setLoading] = useState(false);
  const [requestLoading, setRequestLoading] = useState(false); // <-- ADDED STATE

  const handlePreviewRide = async () => {
    Keyboard.dismiss();
    if (!pickupLocation || !destination) {
      Alert.alert('Error', 'Please enter both pickup and destination.');
      return;
    }
    setLoading(true);
    setPreview(null);
    try {
      const response = await fetch('http://192.168.33.6:5000/api/rides/preview', {
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
      'http://192.168.33.6:5000/api/rides/cancel',
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
        <Text style={styles.heading}>Rider Dashboard</Text>
        <Button title="Logout" onPress={logout} />
      </View>

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

    {/* Cancel Button */}
    <Button title="Cancel Ride" onPress={cancelRide} color="#f33" />
  </View>
)}


      <View style={styles.mapContainer}>
        <MapScreen encodedPolyline={(requestedRide || preview)?.encodedPolyline} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f7fa' },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, paddingTop: 24 },
  heading: { fontSize: 20, fontWeight: 'bold', textAlign: 'left' },
  inputBox: { padding: 12, backgroundColor: '#fff', margin: 12, borderRadius: 8, elevation: 2 },
  input: { borderWidth: 1, marginBottom: 8, padding: 8, borderRadius: 4, backgroundColor: 'white' },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  previewBox: { padding: 12, marginHorizontal: 12, marginBottom: 8, backgroundColor: '#e7f7ee', borderRadius: 8 },
  previewTitle: { fontWeight: 'bold', fontSize: 16, marginBottom: 4 },
  mapContainer: { flex: 1, overflow: 'hidden', borderRadius: 12, margin: 12, backgroundColor: '#eee' },
});

export default RiderDashboard;
