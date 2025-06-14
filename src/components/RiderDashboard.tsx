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

  return (
    <View style={{ flex: 1 }}>
      <Text style={styles.heading}>Rider Dashboard</Text>
      <Button title="Logout" onPress={logout} />
      <View style={styles.inputBox}>
        <TextInput
          style={styles.input}
          placeholder="Pickup location "
          value={pickupLocation}
          onChangeText={setPickupLocation}
        />
        <TextInput
          style={styles.input}
          placeholder="Destination "
          value={destination}
          onChangeText={setDestination}
        />
        <Button title="Preview Ride" onPress={handlePreviewRide} />
      </View>
      {loading && <ActivityIndicator style={{ margin: 12 }} />}
      {preview && (
        <View style={styles.previewBox}>
          <Text>Distance: {preview.distance}</Text>
          <Text>Duration: {preview.duration}</Text>
          <Text>Fare: {preview.estimatedFare}</Text>
        </View>
      )}
      <View style={{ flex: 1 }}>
        <MapScreen />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  heading: {
    fontSize: 20,
    fontWeight: 'bold',
    padding: 16,
    textAlign: 'center',
    backgroundColor: '#f3f3f3',
  },
  inputBox: {
    padding: 12,
    backgroundColor: '#fafafa',
  },
  input: {
    borderWidth: 1,
    marginBottom: 8,
    padding: 8,
    borderRadius: 4,
    backgroundColor: 'white',
  },
  previewBox: {
    padding: 12,
    backgroundColor: '#e7f7ee',
    borderRadius: 6,
    marginHorizontal: 12,
    marginBottom: 8,
  },
});

export default RiderDashboard;
