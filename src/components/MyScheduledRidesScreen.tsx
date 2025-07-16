import React, { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  Alert,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RiderDashboardStackParamList } from '../navigation/RiderDashboardStack';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

// Modern UI Components
import ModernHeader from './ui/ModernHeader';
import ModernCard from './ui/ModernCard';
import ModernButton from './ui/ModernButton';
import StatusBadge from './ui/StatusBadge';

// Theme
import { colors, typography } from '../theme';
import { spacing, borderRadius, shadows } from '../theme/layout';



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
  const [error, setError] = useState<string | null>(null);

  const fetchRides = async () => {
    try {
      setError(null);
      const response = await fetch('http://192.168.33.5:5000/api/prebook/schedule', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch rides');

      const data = await response.json();
      setRides(data.rides);
    } catch (err: any) {
      console.error('Fetch error:', err);
      setError('Could not load scheduled rides. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
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
      <ModernCard style={styles.rideCard}>
        <View style={styles.rideHeader}>
          <View style={styles.rideRoute}>
            <MaterialIcons name="my-location" size={16} color={colors.primary[500]} />
            <Text style={styles.pickupText} numberOfLines={1}>{item.pickup}</Text>
          </View>
          <StatusBadge status={item.status as any} />
        </View>
        
        <View style={styles.destinationRow}>
          <MaterialIcons name="location-on" size={16} color={colors.error[500]} />
          <Text style={styles.destinationText} numberOfLines={1}>{item.destination}</Text>
        </View>

        <View style={styles.rideDetails}>
          <View style={styles.detailRow}>
            <MaterialIcons name="schedule" size={18} color={colors.text.secondary} />
            <Text style={styles.detailText}>
              {dayjs(item.scheduled_time).format('dddd, MMM D • h:mm A')}
            </Text>
          </View>
          
          <View style={styles.fareRow}>
            <View style={styles.fareDetail}>
              <MaterialIcons name="payment" size={16} color={colors.text.secondary} />
              <Text style={styles.fareText}>£{item.estimated_fare}</Text>
            </View>
            <View style={styles.durationDetail}>
              <MaterialIcons name="timer" size={16} color={colors.text.secondary} />
              <Text style={styles.durationText}>{item.duration_minutes} min</Text>
            </View>
          </View>
        </View>

        {item.status === 'pending' && (
          <ModernButton
            title="Cancel Ride"
            variant="error"
            size="sm"
            onPress={() =>
              Alert.alert('Cancel Ride?', 'Are you sure you want to cancel this ride?', [
                { text: 'No', style: 'cancel' },
                { text: 'Yes', onPress: () => cancelRide(item.id), style: 'destructive' },
              ])
            }
            style={styles.cancelButton}
          />
        )}
      </ModernCard>
    </TouchableOpacity>
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchRides();
  };

  useEffect(() => {
    fetchRides();
  }, []);

  if (loading) {
    return (
      <View style={styles.container}>
        <ModernHeader title="Scheduled Rides" onMenuPress={() => navigation.goBack()} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
          <Text style={styles.loadingText}>Loading your scheduled rides...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <ModernHeader title="Scheduled Rides" onMenuPress={() => navigation.goBack()} />
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={64} color={colors.error[500]} />
          <Text style={styles.errorText}>{error}</Text>
          <ModernButton title="Try Again" onPress={fetchRides} />
        </View>
      </View>
    );
  }

  const renderEmptyState = () => (
    <ModernCard style={styles.emptyCard}>
      <MaterialIcons name="schedule" size={64} color={colors.text.tertiary} />
      <Text style={styles.emptyTitle}>No scheduled rides</Text>
      <Text style={styles.emptySubtitle}>
        You can schedule rides in advance from the main screen.
      </Text>
    </ModernCard>
  );

  return (
    <View style={styles.container}>
      <ModernHeader 
        title="Scheduled Rides" 
        subtitle={`${rides.length} ride${rides.length !== 1 ? 's' : ''} scheduled`}
        onMenuPress={() => navigation.goBack()} 
      />
      
      <FlatList
        style={styles.list}
        data={rides}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderRide}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            colors={[colors.primary[500]]}
            tintColor={colors.primary[500]}
          />
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = {
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: spacing[4],
    paddingBottom: spacing[6],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    padding: spacing[6],
  },
  loadingText: {
    ...typography.styles.body,
    color: colors.text.secondary,
    marginTop: spacing[4],
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    padding: spacing[6],
  },
  errorText: {
    ...typography.styles.body,
    color: colors.text.secondary,
    textAlign: 'center' as const,
    marginVertical: spacing[4],
  },
  emptyCard: {
    alignItems: 'center' as const,
    padding: spacing[8],
    marginTop: spacing[8],
  },
  emptyTitle: {
    ...typography.styles.h3,
    color: colors.text.primary,
    marginTop: spacing[4],
    textAlign: 'center' as const,
  },
  emptySubtitle: {
    ...typography.styles.body,
    color: colors.text.secondary,
    textAlign: 'center' as const,
    marginTop: spacing[2],
    lineHeight: 24,
  },
  rideCard: {
    marginBottom: spacing[3],
  },
  rideHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'flex-start' as const,
    marginBottom: spacing[2],
  },
  rideRoute: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    flex: 1,
    marginRight: spacing[2],
  },
  pickupText: {
    ...typography.styles.body,
    fontWeight: 600 as const,
    color: colors.text.primary,
    marginLeft: spacing[2],
    flex: 1,
  },
  destinationRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: spacing[3],
  },
  destinationText: {
    ...typography.styles.body,
    color: colors.text.secondary,
    marginLeft: spacing[2],
    flex: 1,
  },
  rideDetails: {
    marginBottom: spacing[3],
  },
  detailRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: spacing[2],
  },
  detailText: {
    ...typography.styles.body,
    color: colors.text.secondary,
    marginLeft: spacing[2],
  },
  fareRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  },
  fareDetail: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    flex: 1,
  },
  fareText: {
    ...typography.styles.body,
    fontWeight: 600 as const,
    color: colors.primary[600],
    marginLeft: spacing[2],
  },
  durationDetail: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  durationText: {
    ...typography.styles.bodySmall,
    color: colors.text.secondary,
    marginLeft: spacing[1],
  },
  cancelButton: {
    marginTop: spacing[3],
  },
};

export default MyScheduledRidesScreen;
