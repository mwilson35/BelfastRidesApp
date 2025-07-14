import React, { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  Alert,
  Button,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RiderDashboardStackParamList } from '../navigation/RiderDashboardStack';



type Props = {
  token: string;
};

type Ride = {
  id: number;
  pickup: string;
  destination: string;
  scheduled_time: string;
  status: string;
  estimated_fare: number;
  duration_minutes: number;
  encoded_polyline: string;
};

const MyScheduledRidesScreen: React.FC<Props> = ({ token }) => {
  const navigation = useNavigation<NativeStackNavigationProp<RiderDashboardStackParamList>>();

  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRides = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://192.168.33.5:5000/api/prebook/schedule', {
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
      const response = await fetch(`http://192.168.33.5:5000/api/prebook/schedule/${rideId}`, {
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
    <TouchableOpacity
onPress={() => navigation.navigate('ScheduledRideDetails', {
  ride: {
    id: item.id,
    pickup: item.pickup,
    destination: item.destination,
    scheduled_time: item.scheduled_time,
    status: item.status,
    estimated_fare: item.estimated_fare,
    duration_minutes: item.duration_minutes,
    encoded_polyline: item.encoded_polyline,
  }
})}
      activeOpacity={0.7}
    >
      <View
        style={{
          backgroundColor: '#fff',
          borderRadius: 12,
          marginHorizontal: 16,
          marginVertical: 8,
          padding: 16,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 2,
        }}
      >
        <Text style={{ fontWeight: 'bold' }}>{item.pickup} → {item.destination}</Text>
        <Text style={{ marginVertical: 4 }}>
          {dayjs(item.scheduled_time).format('dddd, MMM D • h:mm A')}
        </Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text>Fare: £{item.estimated_fare}</Text>
          <Text>Duration: {item.duration_minutes} min</Text>
        </View>

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
    </TouchableOpacity>
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
