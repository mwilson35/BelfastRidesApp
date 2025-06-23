import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet } from 'react-native';
import axios from 'axios';
import RideHistoryItem from './RideHistoryItem';

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
  const [expandedRideId, setExpandedRideId] = useState<number | null>(null);

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
          <RideHistoryItem
            ride={item}
            expanded={expandedRideId === item.id}
            onToggle={() =>
              setExpandedRideId(expandedRideId === item.id ? null : item.id)
            }
          />
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
