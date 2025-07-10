import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  Alert,
  Button,
  RefreshControl,
} from 'react-native';

type Props = {
  token: string;
};

type Ride = {
  id: number;
  pickup: string;
  destination: string;
  scheduled_time: string;
  status: string;
};

const MyScheduledRidesScreen: React.FC<Props> = ({ token }) => {
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRides = async () => {
    setLoading(true);
    try {
const response = await fetch('http://192.168.33.3:5000/api/prebook/schedule', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch rides');

      const data = await response.json();
      setRides(data.rides);
    } catch (err) {
      console.error('Fetch error:', err);
      Alert.alert('Error', 'Could not load scheduled rides.');
    } finally {
      setLoading(false);
    }
  };

  const cancelRide = async (rideId: number) => {
    try {
const response = await fetch(`http://192.168.33.3:5000/api/prebook/schedule/${rideId}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to cancel ride');

      Alert.alert('Cancelled', 'Ride has been cancelled.');
      fetchRides();
    } catch (err) {
      console.error('Cancel error:', err);
      Alert.alert('Error', 'Could not cancel ride.');
    }
  };

  const renderRide = ({ item }: { item: Ride }) => (
    <View
      style={{
        padding: 16,
        borderBottomWidth: 1,
        borderColor: '#ccc',
        backgroundColor: '#fff',
      }}
    >
      <Text style={{ fontWeight: 'bold' }}>{item.pickup} → {item.destination}</Text>
      <Text style={{ marginVertical: 4 }}>
        Time: {new Date(item.scheduled_time).toLocaleString()}
      </Text>
      <Text>Status: {item.status}</Text>
      {item.status === 'pending' && (
        <View style={{ marginTop: 8 }}>
          <Button
            title="Cancel Ride"
            color="#e53935"
            onPress={() =>
              Alert.alert('Cancel Ride?', 'Are you sure you want to cancel this ride?', [
                { text: 'No', style: 'cancel' },
                { text: 'Yes', onPress: () => cancelRide(item.id), style: 'destructive' },
              ])
            }
          />
        </View>
      )}
    </View>
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchRides();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchRides();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <FlatList
      data={rides}
      keyExtractor={(item) => item.id.toString()}
      renderItem={renderRide}
      contentContainerStyle={{ paddingBottom: 24 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      ListEmptyComponent={
        <View style={{ padding: 20 }}>
          <Text>No scheduled rides.</Text>
        </View>
      }
    />
  );
};

export default MyScheduledRidesScreen;
