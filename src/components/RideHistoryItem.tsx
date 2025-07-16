import React, { useEffect, useState } from 'react';
import { View, Text, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

// Modern UI Components
import ModernCard from './ui/ModernCard';
import StatusBadge from './ui/StatusBadge';

// Theme
import { colors, typography } from '../theme';
import { spacing, borderRadius, shadows } from '../theme/layout';

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
    <ModernCard style={styles.item}>
      <TouchableOpacity onPress={onToggle} activeOpacity={0.7}>
        <View style={styles.header}>
          <View style={styles.routeContainer}>
            <View style={styles.routeRow}>
              <MaterialIcons name="my-location" size={16} color={colors.primary[500]} />
              <Text style={styles.locationText} numberOfLines={1}>{ride.pickup_location}</Text>
            </View>
            <View style={styles.routeRow}>
              <MaterialIcons name="location-on" size={16} color={colors.error[500]} />
              <Text style={styles.locationText} numberOfLines={1}>{ride.destination}</Text>
            </View>
          </View>
          <StatusBadge status={ride.status as any} />
        </View>

        <View style={styles.details}>
          <View style={styles.detailRow}>
            <MaterialIcons name="schedule" size={18} color={colors.text.secondary} />
            <Text style={styles.detailText}>
              {new Date(ride.requested_at).toLocaleString()}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <MaterialIcons name="payment" size={18} color={colors.text.secondary} />
            <Text style={styles.fareText}>
              {ride.fare ? `£${Number(ride.fare).toFixed(2)}` : '£0.00'}
            </Text>
          </View>

          <View style={styles.expandIndicator}>
            <MaterialIcons 
              name={expanded ? "keyboard-arrow-up" : "keyboard-arrow-down"} 
              size={24} 
              color={colors.text.secondary} 
            />
            <Text style={styles.expandText}>
              {expanded ? 'Tap to collapse' : 'Tap for details'}
            </Text>
          </View>
        </View>

        {expanded && (
          <View style={styles.expandedContent}>
            {loading ? (
              <View style={styles.mapLoading}>
                <ActivityIndicator size="small" color={colors.primary[500]} />
                <Text style={styles.mapLoadingText}>Loading map...</Text>
              </View>
            ) : mapUrl ? (
              <Image source={{ uri: mapUrl }} style={styles.map} resizeMode="cover" />
            ) : (
              <View style={styles.mapError}>
                <MaterialIcons name="map" size={32} color={colors.text.tertiary} />
                <Text style={styles.mapErrorText}>Map not available</Text>
              </View>
            )}
          </View>
        )}
      </TouchableOpacity>
    </ModernCard>
  );
};

const styles = {
  item: {
    marginBottom: spacing[3],
    overflow: 'hidden' as const,
  },
  header: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'flex-start' as const,
    marginBottom: spacing[3],
  },
  routeContainer: {
    flex: 1,
    marginRight: spacing[2],
  },
  routeRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: spacing[1],
  },
  locationText: {
    ...typography.styles.body,
    color: colors.text.primary,
    marginLeft: spacing[2],
    flex: 1,
  },
  details: {
    marginBottom: spacing[2],
  },
  detailRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: spacing[2],
  },
  detailText: {
    ...typography.styles.bodySmall,
    color: colors.text.secondary,
    marginLeft: spacing[2],
    flex: 1,
  },
  fareText: {
    ...typography.styles.body,
    color: colors.primary[600],
    fontWeight: 600 as const,
    marginLeft: spacing[2],
    flex: 1,
  },
  expandIndicator: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: spacing[2],
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: spacing[2],
  },
  expandText: {
    ...typography.styles.bodySmall,
    color: colors.text.secondary,
    marginLeft: spacing[1],
  },
  expandedContent: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing[3],
    marginTop: spacing[2],
  },
  map: {
    width: '100%' as const,
    height: 200,
    borderRadius: borderRadius.md,
    backgroundColor: colors.gray[100],
  },
  mapLoading: {
    alignItems: 'center' as const,
    padding: spacing[6],
  },
  mapLoadingText: {
    ...typography.styles.bodySmall,
    color: colors.text.secondary,
    marginTop: spacing[2],
  },
  mapError: {
    alignItems: 'center' as const,
    padding: spacing[6],
    backgroundColor: colors.gray[50],
    borderRadius: borderRadius.md,
  },
  mapErrorText: {
    ...typography.styles.bodySmall,
    color: colors.text.tertiary,
    marginTop: spacing[2],
  },
};

export default RideHistoryItem;
