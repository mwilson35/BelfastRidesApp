import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Button, Alert, ScrollView, Image } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { RiderDashboardStackParamList } from '../navigation/RiderDashboardStack';
import dayjs from 'dayjs';

type ScreenRouteProp = RouteProp<RiderDashboardStackParamList, 'ScheduledRideDetails'>;

type Props = {
  token: string;
};

const ScheduledRideDetailsScreen: React.FC<Props> = ({ token }) => {
  const route = useRoute<ScreenRouteProp>();
  const navigation = useNavigation();
  const { ride } = route.params;

  const [mapUrl, setMapUrl] = useState('');
  const [loadingMap, setLoadingMap] = useState(false);

  useEffect(() => {
    if (!ride.pickup || !ride.destination) return;

    setLoadingMap(true);

    fetch(
      `http://192.168.33.5:5000/api/maps/staticmap?pickup=${encodeURIComponent(
        ride.pickup
      )}&dropoff=${encodeURIComponent(ride.destination)}`
    )
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch map');
        return res.json();
      })
      .then((data) => {
        setMapUrl(data.url || '');
      })
      .catch((err) => {
        console.error('Static map fetch error:', err);
        setMapUrl('');
      })
      .finally(() => setLoadingMap(false));
  }, [ride]);

  const handleCancel = async () => {
    Alert.alert('Cancel Ride', 'Are you sure?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, Cancel',
        style: 'destructive',
        onPress: async () => {
          try {
            const res = await fetch(`http://192.168.33.5:5000/api/prebook/schedule/${ride.id}`, {
              method: 'PATCH',
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            });

            if (!res.ok) throw new Error('Cancel failed');
            Alert.alert('Ride cancelled');
            navigation.goBack();
          } catch (err: any) {
            Alert.alert('Error', err.message);
          }
        },
      },
    ]);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.route}>{ride.pickup} → {ride.destination}</Text>

      <Text style={styles.label}>
        {dayjs(ride.scheduled_time).format('dddd, MMM D • h:mm A')}
      </Text>

<Text style={styles.label}>
  Fare: £{Number(ride.estimated_fare).toFixed(2)}
</Text>

<Text style={styles.label}>
  Duration: {typeof ride.duration_minutes === 'number' ? ride.duration_minutes : '--'} minutes
</Text>

      <View style={styles.mapBox}>
        {loadingMap ? (
          <Text>Loading map...</Text>
        ) : mapUrl ? (
          <Image style={styles.mapImage} source={{ uri: mapUrl }} />
        ) : (
          <Text>Map not available</Text>
        )}
      </View>

      {new Date(ride.scheduled_time) > new Date() && (
        <Button title="Cancel Ride" onPress={handleCancel} color="#e53935" />
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  route: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  label: {
    fontSize: 16,
    marginBottom: 6,
  },
  mapBox: {
    marginVertical: 20,
    alignItems: 'center',
  },
  mapImage: {
    width: '100%',
    height: 200,
    borderRadius: 10,
  },
});

export default ScheduledRideDetailsScreen;
