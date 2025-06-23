import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';

type Props = {
  ride: {
    id: number;
    pickup_location: string;
    destination: string;
    requested_at: string;
    fare: number;
    status: string;
  };
  expanded: boolean;
  onToggle: () => void;
};

const GOOGLE_MAPS_API_KEY = 'AIzaSyBN67af-oAZ0kt13niZ4H1S_i3q-S2Uiv8';

const RideHistoryItem: React.FC<Props> = ({ ride, expanded, onToggle }) => {
  const [mapUrl, setMapUrl] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!expanded) return;

    setLoading(true);
    const base = 'https://maps.googleapis.com/maps/api/staticmap';
    const size = '600x300';
    const pickup = encodeURIComponent(ride.pickup_location);
    const dropoff = encodeURIComponent(ride.destination);
    const url = `${base}?size=${size}&markers=color:green|label:P|${pickup}&markers=color:red|label:D|${dropoff}&key=${GOOGLE_MAPS_API_KEY}`;
    setMapUrl(url);
    setLoading(false);
  }, [expanded, ride]);

  return (
    <TouchableOpacity onPress={onToggle} style={styles.item}>
      <Text style={styles.title}>{ride.pickup_location} → {ride.destination}</Text>
      <Text>Status: {ride.status}</Text>
      <Text>Date: {new Date(ride.requested_at).toLocaleString()}</Text>
      <Text>Fare: {ride.fare ? `£${Number(ride.fare).toFixed(2)}` : '£00.00'}</Text>
{expanded && (
  loading ? (
    <ActivityIndicator style={{ marginTop: 10 }} />
  ) : mapUrl ? (
    <Image
      source={{ uri: mapUrl }}
      style={styles.map}
      resizeMode="cover"
    />
  ) : (
    <Text style={{ marginTop: 10 }}>Map not available</Text>
  )
)}

    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  item: {
    marginBottom: 15,
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#f2f2f2',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  map: {
    width: '100%',
    height: 200,
    marginTop: 10,
    borderRadius: 8,
  },
});

export default RideHistoryItem;
