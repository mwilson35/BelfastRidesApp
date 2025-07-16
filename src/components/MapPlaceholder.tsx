import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { colors, typography, layout } from '../theme';

export interface MapPlaceholderProps {
  destination?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  pickupLocation?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  driverLocation?: {
    latitude: number;
    longitude: number;
  };
  routePolyline?: string;
  showRoute?: boolean;
  onLocationUpdate?: (location: { latitude: number; longitude: number }) => void;
}

const MapPlaceholder: React.FC<MapPlaceholderProps> = ({
  destination,
  pickupLocation,
  driverLocation,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <MaterialIcons name="map" size={64} color={colors.primary[300]} />
        <Text style={styles.title}>Map View</Text>
        <Text style={styles.subtitle}>Map integration coming soon</Text>
        
        {pickupLocation && (
          <View style={styles.locationInfo}>
            <MaterialIcons name="my-location" size={20} color={colors.success[500]} />
            <Text style={styles.locationText}>
              Pickup: {pickupLocation.address || `${pickupLocation.latitude.toFixed(4)}, ${pickupLocation.longitude.toFixed(4)}`}
            </Text>
          </View>
        )}
        
        {destination && (
          <View style={styles.locationInfo}>
            <MaterialIcons name="location-on" size={20} color={colors.error[500]} />
            <Text style={styles.locationText}>
              Destination: {destination.address || `${destination.latitude.toFixed(4)}, ${destination.longitude.toFixed(4)}`}
            </Text>
          </View>
        )}
        
        {driverLocation && (
          <View style={styles.locationInfo}>
            <MaterialIcons name="local-taxi" size={20} color={colors.warning[500]} />
            <Text style={styles.locationText}>
              Driver: {driverLocation.latitude.toFixed(4)}, {driverLocation.longitude.toFixed(4)}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[100],
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: layout.spacing[6],
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontFamily: typography.fontFamily.bold,
    color: colors.text.primary,
    marginTop: layout.spacing[4],
    marginBottom: layout.spacing[2],
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.regular,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: layout.spacing[6],
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: layout.spacing[3],
    marginVertical: layout.spacing[1],
    borderRadius: layout.borderRadius.md,
    width: '100%',
    maxWidth: 300,
  },
  locationText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.text.primary,
    marginLeft: layout.spacing[2],
    flex: 1,
  },
});

export default MapPlaceholder;
