import React, { useState } from 'react';
import { View, Text, StyleSheet, Button, TextInput, Keyboard, ActivityIndicator, Alert } from 'react-native';
import MapScreen from './MapScreen';

type Props = {
  logout: () => void;
};

const RiderDashboard: React.FC<Props> = ({ logout }) => {
  const [pickupLocation, setPickupLocation] = useState('');
  const [destination, setDestination] = useState('');
  const [preview, setPreview] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handlePreviewRide = async () => {
    Keyboard.dismiss();
    if (!pickupLocation || !destination) {
      Alert.alert('Error', 'Please enter both pickup and destination.');
      return;
    }
    setLoading(true);
    setPreview(null);
    try {
      const response = await fetch('http://192.168.33.6:5000/rides/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

  const handleClearPreview = () => {
    setPreview(null);
    setPickupLocation('');
    setDestination('');
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
      {preview && (
        <View style={styles.previewBox}>
          <Text style={styles.previewTitle}>Ride Preview</Text>
          <Text>Distance: {preview.distance}</Text>
          <Text>Duration: {preview.duration}</Text>
          <Text>Fare: {preview.estimatedFare}</Text>
        </View>
      )}
      <View style={styles.mapContainer}>
        <MapScreen encodedPolyline={preview?.encodedPolyline} />
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
