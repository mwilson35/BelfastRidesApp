import React, { useState } from 'react';
import { View, Text, TextInput, Button, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

type Props = {
  token: string;
};
const PrebookScreen: React.FC<Props> = ({ token }) => {
  const [pickup, setPickup] = useState('');
  const [destination, setDestination] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);

  const previewRide = async () => {
    try {
const response = await fetch('http://192.168.33.3:5000/api/prebook/preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          pickupLocation: pickup,
          destination: destination
        })
      });

      if (!response.ok) {
        throw new Error('Preview failed');
      }

      const data = await response.json();
      setPreviewData(data);
    } catch (err) {
      console.error('Error previewing ride:', err);
    }
  };


  const onChangeDate = (_: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) setDate(selectedDate);
  };

  const onChangeTime = (_: any, selectedTime?: Date) => {
    setShowTimePicker(Platform.OS === 'ios');
    if (selectedTime) {
      const updatedDate = new Date(date);
      updatedDate.setHours(selectedTime.getHours());
      updatedDate.setMinutes(selectedTime.getMinutes());
      setDate(updatedDate);
    }
  };

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text>Pickup Location</Text>
      <TextInput
        value={pickup}
        onChangeText={setPickup}
        placeholder="Enter pickup"
        style={{ borderBottomWidth: 1, marginBottom: 16 }}
      />

      <Text>Destination</Text>
      <TextInput
        value={destination}
        onChangeText={setDestination}
        placeholder="Enter destination"
        style={{ borderBottomWidth: 1, marginBottom: 16 }}
      />

      <Button title="Select Date" onPress={() => setShowDatePicker(true)} />
      {showDatePicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display="default"
          onChange={onChangeDate}
        />
      )}

      <Button title="Select Time" onPress={() => setShowTimePicker(true)} />
      {showTimePicker && (
        <DateTimePicker
          value={date}
          mode="time"
          display="default"
          onChange={onChangeTime}
        />
      )}
      <View style={{ marginTop: 24 }}>
        <Button title="Preview Ride" onPress={previewRide} />
      </View>

      {previewData && (
        <View style={{ marginTop: 24 }}>
          <Text>Distance: {previewData.distance}</Text>
          <Text>Duration: {previewData.duration}</Text>
          <Text>Estimated Fare: {previewData.estimatedFare}</Text>
          <Text>Date: {date.toLocaleDateString()}</Text>
          <Text>Time: {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
        </View>
      )}
    </View>
  );
};


export default PrebookScreen;
