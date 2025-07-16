import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Platform,
  PermissionsAndroid,
  AppState,
  AppStateStatus,
  BackHandler,
} from 'react-native';
import { colors, typography, layout } from '../theme';

export interface MapScreenProps {
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

const MapScreenSafe: React.FC<MapScreenProps> = ({
  destination,
  pickupLocation,
  driverLocation,
  routePolyline,
  showRoute = false,
  onLocationUpdate,
}) => {
  const [isMapEnabled, setIsMapEnabled] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initializationStep, setInitializationStep] = useState(0);

  const isMountedRef = useRef(true);
  const initTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Progressive initialization to avoid native crashes
  useEffect(() => {
    isMountedRef.current = true;
    
    const initializeMap = async () => {
      try {
        setInitializationStep(1);
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        if (!isMountedRef.current) return;
        setInitializationStep(2);
        
        // Check permissions first
        if (Platform.OS === 'android') {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
            {
              title: 'Location Permission',
              message: 'This app needs access to location to show your position on the map.',
              buttonNeutral: 'Ask Me Later',
              buttonNegative: 'Cancel',
              buttonPositive: 'OK',
            }
          );
          if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
            setError('Location permission denied');
            setIsLoading(false);
            return;
          }
        }

        if (!isMountedRef.current) return;
        setInitializationStep(3);
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Get location using basic geolocation
        const { default: Geolocation } = await import('@react-native-community/geolocation');
        
        Geolocation.getCurrentPosition(
          (position) => {
            if (isMountedRef.current) {
              const location = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
              };
              setCurrentLocation(location);
              onLocationUpdate?.(location);
              setIsLoading(false);
              
              // Only enable map after successful location
              setInitializationStep(4);
              setTimeout(() => {
                if (isMountedRef.current) {
                  setIsMapEnabled(true);
                }
              }, 2000);
            }
          },
          (error) => {
            console.warn('Location error:', error);
            if (isMountedRef.current) {
              setError('Unable to get location');
              setIsLoading(false);
            }
          },
          {
            enableHighAccuracy: false,
            timeout: 15000,
            maximumAge: 30000,
          }
        );

      } catch (err) {
        console.warn('Map initialization error:', err);
        if (isMountedRef.current) {
          setError('Map initialization failed');
          setIsLoading(false);
        }
      }
    };

    initializeMap();

    return () => {
      isMountedRef.current = false;
      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current);
      }
    };
  }, [onLocationUpdate]);

  const getStepMessage = () => {
    switch (initializationStep) {
      case 1: return 'Initializing map system...';
      case 2: return 'Checking permissions...';
      case 3: return 'Getting your location...';
      case 4: return 'Preparing map...';
      default: return 'Loading map...';
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
        <Text style={styles.loadingText}>{getStepMessage()}</Text>
        <Text style={styles.stepText}>Step {initializationStep} of 4</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Map Unavailable</Text>
        <Text style={styles.errorDescription}>{error}</Text>
        <Text style={styles.fallbackText}>
          Map view is temporarily unavailable. Location services are still working.
        </Text>
      </View>
    );
  }

  if (!currentLocation) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Location Required</Text>
        <Text style={styles.errorDescription}>
          Unable to determine your location. Please check your location settings.
        </Text>
      </View>
    );
  }

  if (!isMapEnabled) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
        <Text style={styles.loadingText}>Preparing map...</Text>
        <Text style={styles.locationText}>
          📍 Location: {currentLocation.latitude.toFixed(4)}, {currentLocation.longitude.toFixed(4)}
        </Text>
      </View>
    );
  }

  // Lazy load the actual map component
  const LazyMapView = React.lazy(() => 
    import('react-native-maps').then(module => ({ default: module.default }))
  );

  return (
    <View style={styles.container}>
      <React.Suspense 
        fallback={
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary[500]} />
            <Text style={styles.loadingText}>Loading map...</Text>
          </View>
        }
      >
        <LazyMapView
          style={styles.map}
          provider="google"
          initialRegion={{
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude,
            latitudeDelta: 0.015,
            longitudeDelta: 0.015,
          }}
          showsUserLocation={true}
          showsMyLocationButton={false}
          loadingEnabled={true}
          mapType="standard"
        />
      </React.Suspense>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: layout.spacing[6],
  },
  loadingText: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.medium,
    color: colors.text.primary,
    marginTop: layout.spacing[4],
    textAlign: 'center',
  },
  stepText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.text.secondary,
    marginTop: layout.spacing[2],
  },
  locationText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.text.secondary,
    marginTop: layout.spacing[4],
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: layout.spacing[6],
  },
  errorText: {
    fontSize: typography.fontSize['2xl'],
    fontFamily: typography.fontFamily.bold,
    color: colors.error[500],
    marginBottom: layout.spacing[3],
    textAlign: 'center',
  },
  errorDescription: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.regular,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: layout.spacing[4],
  },
  fallbackText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.text.tertiary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default MapScreenSafe;
