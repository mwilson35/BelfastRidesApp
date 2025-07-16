import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

import RideHistoryItem from './RideHistoryItem';

// Modern UI Components
import ModernHeader from './ui/ModernHeader';
import ModernCard from './ui/ModernCard';
import ModernButton from './ui/ModernButton';

// Theme
import { colors, typography } from '../theme';
import { spacing, borderRadius, shadows } from '../theme/layout';

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
  const navigation = useNavigation();
  const [rideHistory, setRideHistory] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedRideId, setExpandedRideId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchRideHistory = async () => {
    try {
      setError(null);
      const response = await axios.get('http://192.168.33.5:5000/api/rides/history', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRideHistory(response.data);
    } catch (err: any) {
      console.error('Error fetching ride history:', err);
      setError('Failed to load ride history. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRideHistory();
  }, [token]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchRideHistory();
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ModernHeader title="Ride History" onMenuPress={() => navigation.goBack()} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
          <Text style={styles.loadingText}>Loading your ride history...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <ModernHeader title="Ride History" onMenuPress={() => navigation.goBack()} />
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={64} color={colors.error[500]} />
          <Text style={styles.errorText}>{error}</Text>
          <ModernButton title="Try Again" onPress={fetchRideHistory} />
        </View>
      </View>
    );
  }

  const renderEmptyState = () => (
    <ModernCard style={styles.emptyCard}>
      <MaterialIcons name="history" size={64} color={colors.text.tertiary} />
      <Text style={styles.emptyTitle}>No rides yet</Text>
      <Text style={styles.emptySubtitle}>Your ride history will appear here once you start taking trips.</Text>
    </ModernCard>
  );

  return (
    <View style={styles.container}>
      <ModernHeader 
        title="Ride History" 
        subtitle={`${rideHistory.length} ride${rideHistory.length !== 1 ? 's' : ''}`}
        onMenuPress={() => navigation.goBack()} 
      />
      
      <FlatList
        style={styles.list}
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
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary[500]]}
            tintColor={colors.primary[500]}
          />
        }
        contentContainerStyle={styles.listContent}
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
};

export default RideHistoryScreen;
