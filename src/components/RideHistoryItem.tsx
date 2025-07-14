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

const BACKEND_URL = 'http://192.168.33.5:5000';

const RideHistoryItem: React.FC<Props> = ({ ride, expanded, onToggle }) => {
  const [mapUrl, setMapUrl] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!expanded) return;

    setLoading(true);

    fetch(
      `${BACKEND_URL}/api/maps/staticmap?pickup=${encodeURIComponent(
        ride.pickup_location
      )}&dropoff=${encodeURIComponent(ride.destination)}`
    )
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch map');
        return res.json();
      })
      .then(data => {
        setMapUrl(data.url || '');
        setLoading(false);
      })
      .catch(err => {
        console.error('Map fetch error:', err);
        setMapUrl('');
        setLoading(false);
      });
  }, [expanded, ride]);

  return (
    <TouchableOpacity onPress={onToggle} style={styles.item}>
      <Text style={styles.title}>
        {ride.pickup_location} → {ride.destination}
      </Text>
      <Text>Status: {ride.status}</Text>
      <Text>Date: {new Date(ride.requested_at).toLocaleString()}</Text>
      <Text>Fare: {ride.fare ? `£${Number(ride.fare).toFixed(2)}` : '£00.00'}</Text>
      {expanded && (
        loading ? (
          <ActivityIndicator style={{ marginTop: 10 }} />
        ) : mapUrl ? (
          <Image source={{ uri: mapUrl }} style={styles.map} resizeMode="cover" />
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
