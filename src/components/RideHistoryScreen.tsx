import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet } from 'react-native';
import axios from 'axios';

type Ride = {
  id: number;
  pickup_location: string;
  destination: string;
  requested_at: string;
  fare: number;
  status: string;
};

type Props = {
  token: string;
};

const RideHistoryScreen: React.FC<Props> = ({ token }) => {
  const [rideHistory, setRideHistory] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get('http://192.168.33.3:5000/api/rides/history', {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(response => setRideHistory(response.data))
      .catch(err => console.error('Error fetching ride history:', err))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
<FlatList
  data={rideHistory}
  keyExtractor={(item) => item.id.toString()}
  renderItem={({ item }) => (
    <View style={styles.item}>
      <Text style={styles.title}>
        {item.pickup_location} → {item.destination}
      </Text>
      <Text>Status: {item.status}</Text>
      <Text>Date: {new Date(item.requested_at).toLocaleString()}</Text>
<Text>
  Fare: {item.fare ? `£${Number(item.fare).toFixed(2)}` : '£00.00'}
</Text>

    </View>
  )}
  ListEmptyComponent={<Text>No rides found.</Text>}
/>


    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
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
});

export default RideHistoryScreen;
