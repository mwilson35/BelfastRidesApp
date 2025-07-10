import React, { useState } from 'react';
import { View, Text, TextInput, Button, Platform, Pressable } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import dayjs from 'dayjs';
import { Alert } from 'react-native';
import MapView, { Polyline, Marker } from 'react-native-maps';
import PrebookMap from './PrebookMap';



type Props = {
  token: string;
};

const PrebookScreen: React.FC<Props> = ({ token }) => {
  const [pickup, setPickup] = useState('');
  const [destination, setDestination] = useState('');
  const [date, setDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [pickerMode, setPickerMode] = useState<'date' | 'time'>('date');
  const [previewData, setPreviewData] = useState<any>(null);

  const formattedDate = dayjs(date).format('ddd, D MMM YYYY');
  const formattedTime = dayjs(date).format('HH:mm');

  const onChangeDateTime = (_: any, selected?: Date) => {
    setShowPicker(false);
    if (selected) setDate(selected);
  };

  const previewRide = async () => {
    try {
      const response = await fetch('http://192.168.33.3:5000/api/prebook/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pickupLocation: pickup, destination })
      });

      if (!response.ok) throw new Error('Preview failed');

      const data = await response.json();
      setPreviewData(data);
    } catch (err) {
      console.error('Error previewing ride:', err);
    }
  };

  const confirmBooking = async () => {
    try {
      const response = await fetch('http://192.168.33.3:5000/api/prebook/schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          pickup: previewData.pickupLocation,
          destination: previewData.destination,
          scheduled_time: date.toISOString(),
          pickup_lat: previewData.pickupLat,
          pickup_lng: previewData.pickupLng,
          destination_lat: previewData.destinationLat,
          destination_lng: previewData.destinationLng,
          encoded_polyline: previewData.encodedPolyline,
          estimated_fare: parseFloat(previewData.estimatedFare.replace('£', '')),
          duration_minutes: parseInt(previewData.duration.replace(' mins', ''), 10)
        })
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text);
      }

      const data = await response.json();
Alert.alert('Ride booked!', `ID: ${data.rideId}`);
      setPreviewData(null);
      setPickup('');
      setDestination('');
    } catch (err: unknown) {
Alert.alert('Booking failed', (err as Error).message);
    }
  };

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontWeight: 'bold', marginBottom: 4 }}>Pickup Location</Text>
      <TextInput
        value={pickup}
        onChangeText={setPickup}
        placeholder="Enter pickup"
        style={{ borderBottomWidth: 1, marginBottom: 16 }}
      />

      <Text style={{ fontWeight: 'bold', marginBottom: 4 }}>Destination</Text>
      <TextInput
        value={destination}
        onChangeText={setDestination}
        placeholder="Enter destination"
        style={{ borderBottomWidth: 1, marginBottom: 16 }}
      />

      <Text style={{ fontWeight: 'bold', marginBottom: 4 }}>Scheduled Date & Time</Text>
      <Pressable
        onPress={() => {
          setPickerMode('date');
          setShowPicker(true);
        }}
        style={{
          padding: 12,
          borderWidth: 1,
          borderRadius: 6,
          marginBottom: 12
        }}
      >
        <Text>{`${formattedDate} · ${formattedTime}`}</Text>
      </Pressable>

      {showPicker && (
        <DateTimePicker
          value={date}
          mode={pickerMode}
          display="default"
          onChange={(e, selected) => {
            onChangeDateTime(e, selected);
            if (pickerMode === 'date') {
              setTimeout(() => {
                setPickerMode('time');
                setShowPicker(true);
              }, 100);
            }
          }}
        />
      )}

      <Button title="Preview Ride" onPress={previewRide} />

{previewData && (
  <View style={{ marginTop: 24, padding: 12, borderWidth: 1, borderRadius: 6 }}>
    <Text>Distance: {previewData.distance}</Text>
    <Text>Duration: {previewData.duration}</Text>
    <Text>Fare: {previewData.estimatedFare}</Text>
    <Text style={{ marginBottom: 12 }}>
      Est. Arrival: {dayjs(date).add(parseInt(previewData.duration), 'minute').format('HH:mm')}
    </Text>

    <View style={{ height: 200, marginVertical: 12 }}>
<PrebookMap encodedPolyline={previewData.encodedPolyline} />

    </View>

    <Button title="Confirm Booking" onPress={confirmBooking} />
    <View style={{ height: 8 }} />
    <Button
      title="Clear Preview"
      color="gray"
      onPress={() => {
        setPreviewData(null);
        setPickup('');
        setDestination('');
        setDate(new Date());
      }}
    />
  </View>
)}

    </View>
  );
};

export default PrebookScreen;
