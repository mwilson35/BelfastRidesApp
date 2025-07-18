import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  PermissionsAndroid,
  Platform,
  TouchableOpacity,
  Alert,
  Dimensions,
  StatusBar,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import Geolocation from '@react-native-community/geolocation';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
// @ts-ignore
import PolylineDecoder from '@mapbox/polyline';

// Theme
import { colors } from '../theme';

// Services
import { DriverService } from '../services/DriverService';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

type DriverLocation = {
  latitude: number;
  longitude: number;
  heading?: number;
  speed?: number;
};

type RideWaypoint = {
  latitude: number;
  longitude: number;
  title: string;
  description: string;
  type: 'pickup' | 'destination';
};

type Props = {
  activeRide?: {
    id: number;
    pickup: RideWaypoint;
    destination: RideWaypoint;
    encodedPolyline?: string;
    status: 'accepted' | 'in_progress' | 'completed';
  } | null;
  onLocationUpdate?: (location: DriverLocation) => void;
  onNavigationAction?: (action: 'start_navigation' | 'arrived_pickup' | 'start_trip' | 'complete_trip') => void;
  driverId?: number;
  driverToken?: string;
};

const DriverMapScreen: React.FC<Props> = ({ 
  activeRide, 
  onLocationUpdate, 
  onNavigationAction,
  driverId,
  driverToken 
}) => {
  const mapRef = useRef<MapView>(null);
  const [driverLocation, setDriverLocation] = useState<DriverLocation | null>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<Array<{latitude: number, longitude: number}>>([]);
  const [mapReady, setMapReady] = useState(false);
  const [following, setFollowing] = useState(true);
  const [locationPermission, setLocationPermission] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const watchIdRef = useRef<number | null>(null);
  const driverServiceRef = useRef<DriverService | null>(null);

  // Initialize driver service
  useEffect(() => {
    if (driverToken && driverId) {
      const driverService = DriverService.getInstance();
      driverService.setDriverToken(driverToken);
      driverService.initializeSocket(driverId);
      driverServiceRef.current = driverService;

      // Listen for ride assignments
      driverService.onRideAssigned((rideData) => {
        Alert.alert(
          'New Ride Request',
          `Pickup: ${rideData.pickup.title}\nDestination: ${rideData.destination.title}`,
          [
            { text: 'Decline', style: 'cancel' },
            { text: 'Accept', onPress: () => handleAcceptRide(rideData) }
          ]
        );
      });

      return () => {
        driverService.disconnect();
      };
    }
  }, [driverToken, driverId]);

  const handleAcceptRide = async (rideData: any) => {
    try {
      if (driverServiceRef.current) {
        await driverServiceRef.current.updateRideStatus(rideData.id, 'assigned');
        Alert.alert('Ride Accepted', 'Navigate to pickup location');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to accept ride');
    }
  };

  // Belfast default region
  const DEFAULT_REGION = {
    latitude: 54.607868,
    longitude: -5.926437,
    latitudeDelta: 0.015,
    longitudeDelta: 0.015,
  };

  // Request location permissions
  useEffect(() => {
    const requestLocationPermission = async () => {
      if (Platform.OS === 'android') {
        try {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
            {
              title: 'Driver Location Permission',
              message: 'This app needs access to your location to provide navigation services.',
              buttonNeutral: 'Ask Me Later',
              buttonNegative: 'Cancel',
              buttonPositive: 'OK',
            }
          );
          if (granted === PermissionsAndroid.RESULTS.GRANTED) {
            setLocationPermission(true);
          } else {
            Alert.alert('Permission Required', 'Location permission is required for navigation.');
          }
        } catch (err) {
          console.warn(err);
        }
      } else {
        setLocationPermission(true);
      }
    };

    requestLocationPermission();
  }, []);

  // Start continuous location tracking
  useEffect(() => {
    if (!locationPermission) return;

    const startLocationTracking = () => {
      // Get initial position
      Geolocation.getCurrentPosition(
        (position) => {
          const newLocation: DriverLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            heading: position.coords.heading || 0,
            speed: position.coords.speed || 0,
          };
          setDriverLocation(newLocation);
          onLocationUpdate?.(newLocation);
        },
        (error) => {
          console.warn('Error getting initial location:', error);
        },
        { enableHighAccuracy: true, timeout: 20000, maximumAge: 1000 }
      );

      // Start continuous tracking
      watchIdRef.current = Geolocation.watchPosition(
        (position) => {
          const newLocation: DriverLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            heading: position.coords.heading || 0,
            speed: position.coords.speed || 0,
          };
          setDriverLocation(newLocation);
          onLocationUpdate?.(newLocation);

          // Update backend with location if driver is online
          if (isOnline && driverServiceRef.current) {
            driverServiceRef.current.updateDriverLocation(newLocation).catch(error => {
              console.warn('Failed to update backend location:', error);
            });
          }

          // Auto-follow driver location if enabled
          if (following && mapRef.current && mapReady) {
            mapRef.current.animateToRegion({
              latitude: newLocation.latitude,
              longitude: newLocation.longitude,
              latitudeDelta: 0.008,
              longitudeDelta: 0.008,
            }, 1000);
          }
        },
        (error) => {
          console.warn('Location watch error:', error);
        },
        {
          enableHighAccuracy: true,
          distanceFilter: 5, // Update every 5 meters
          interval: 3000, // Update every 3 seconds
          fastestInterval: 1000, // Fastest update: 1 second
        }
      );
    };

    startLocationTracking();

    return () => {
      if (watchIdRef.current !== null) {
        Geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [locationPermission, following, mapReady, onLocationUpdate]);

  // Decode route polyline when active ride changes
  useEffect(() => {
    if (activeRide?.encodedPolyline) {
      try {
        const decoded = PolylineDecoder.decode(activeRide.encodedPolyline).map(
          ([latitude, longitude]: [number, number]) => ({ latitude, longitude })
        );
        setRouteCoordinates(decoded);
      } catch (error) {
        console.warn('Error decoding polyline:', error);
        setRouteCoordinates([]);
      }
    } else {
      setRouteCoordinates([]);
    }
  }, [activeRide?.encodedPolyline]);

  // Fit map to route when route changes
  useEffect(() => {
    if (mapRef.current && routeCoordinates.length > 0 && mapReady) {
      const coordinates = [...routeCoordinates];
      if (driverLocation) {
        coordinates.push(driverLocation);
      }
      
      mapRef.current.fitToCoordinates(coordinates, {
        edgePadding: { top: 100, right: 50, bottom: 200, left: 50 },
        animated: true,
      });
    }
  }, [routeCoordinates, mapReady, driverLocation]);

  const handleMyLocation = () => {
    if (driverLocation && mapRef.current) {
      setFollowing(true);
      mapRef.current.animateToRegion({
        latitude: driverLocation.latitude,
        longitude: driverLocation.longitude,
        latitudeDelta: 0.008,
        longitudeDelta: 0.008,
      }, 1000);
    }
  };

  const handleMapPress = () => {
    setFollowing(false);
  };

  const getCurrentTarget = () => {
    if (!activeRide) return null;
    
    switch (activeRide.status) {
      case 'accepted':
        return activeRide.pickup;
      case 'in_progress':
        return activeRide.destination;
      default:
        return null;
    }
  };

  const getNavigationButtonText = () => {
    if (!activeRide) return null;
    
    switch (activeRide.status) {
      case 'accepted':
        return 'Start Trip';
      case 'in_progress':
        return 'Complete Trip';
      default:
        return null;
    }
  };

  const handleNavigationAction = () => {
    if (!activeRide) return;
    
    switch (activeRide.status) {
      case 'accepted':
        onNavigationAction?.('start_trip');
        break;
      case 'in_progress':
        onNavigationAction?.('complete_trip');
        break;
    }
  };

  const handleToggleOnlineStatus = async () => {
    if (!driverServiceRef.current || !driverLocation) {
      Alert.alert('Error', 'Unable to change status. Location required.');
      return;
    }

    setIsLoading(true);
    
    try {
      const newStatus = isOnline ? 'offline' : 'online';
      await driverServiceRef.current.updateDriverStatus(newStatus, {
        latitude: driverLocation.latitude,
        longitude: driverLocation.longitude
      });
      
      setIsOnline(!isOnline);
      
      const message = newStatus === 'online' 
        ? 'You are now online and will receive ride requests'
        : 'You are now offline and will not receive ride requests';
      
      Alert.alert('Status Updated', message);
    } catch (error) {
      console.error('Failed to update status:', error);
      Alert.alert('Error', 'Failed to update status. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const target = getCurrentTarget();
  const navigationButtonText = getNavigationButtonText();

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={colors.primary[600]} barStyle="light-content" />
      
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={DEFAULT_REGION}
        showsUserLocation={false} // We'll show custom driver marker
        showsMyLocationButton={false}
        followsUserLocation={false}
        rotateEnabled={true}
        pitchEnabled={true}
        onMapReady={() => setMapReady(true)}
        onPress={handleMapPress}
        mapType="standard"
      >
        {/* Driver Location Marker */}
        {driverLocation && (
          <Marker
            coordinate={driverLocation}
            anchor={{ x: 0.5, y: 0.5 }}
            rotation={driverLocation.heading || 0}
            flat={true}
          >
            <View style={styles.driverMarker}>
              <MaterialIcons name="navigation" size={24} color="#fff" />
            </View>
          </Marker>
        )}

        {/* Active Ride Markers */}
        {activeRide && (
          <>
            {/* Pickup Marker */}
            <Marker
              coordinate={activeRide.pickup}
              title={activeRide.pickup.title}
              description={activeRide.pickup.description}
            >
              <View style={styles.pickupMarker}>
                <MaterialIcons name="person-pin" size={30} color="#fff" />
              </View>
            </Marker>

            {/* Destination Marker */}
            <Marker
              coordinate={activeRide.destination}
              title={activeRide.destination.title}
              description={activeRide.destination.description}
            >
              <View style={styles.destinationMarker}>
                <MaterialIcons name="place" size={30} color="#fff" />
              </View>
            </Marker>
          </>
        )}

        {/* Route Polyline */}
        {routeCoordinates.length > 0 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeColor={colors.primary[500]}
            strokeWidth={4}
            lineDashPattern={[1]}
          />
        )}
      </MapView>

      {/* Controls Overlay */}
      <View style={styles.controlsContainer}>
        {/* Online/Offline Toggle */}
        <TouchableOpacity 
          style={[styles.statusToggle, isOnline ? styles.onlineToggle : styles.offlineToggle]} 
          onPress={handleToggleOnlineStatus}
          disabled={isLoading}
        >
          <MaterialIcons 
            name={isOnline ? 'radio-button-checked' : 'radio-button-unchecked'} 
            size={20} 
            color={isOnline ? colors.success[600] : colors.gray[600]} 
          />
          <Text style={[styles.statusText, isOnline ? styles.onlineText : styles.offlineText]}>
            {isLoading ? 'Updating...' : isOnline ? 'Online' : 'Offline'}
          </Text>
        </TouchableOpacity>

        {/* My Location Button */}
        <TouchableOpacity style={styles.myLocationButton} onPress={handleMyLocation}>
          <MaterialIcons 
            name="my-location" 
            size={24} 
            color={following ? colors.primary[500] : colors.gray[600]} 
          />
        </TouchableOpacity>

        {/* Speed Display */}
        {driverLocation?.speed !== undefined && (
          <View style={styles.speedDisplay}>
            <Text style={styles.speedText}>
              {Math.round((driverLocation.speed || 0) * 3.6)} km/h
            </Text>
          </View>
        )}
      </View>

      {/* Navigation Info Panel */}
      {activeRide && target && (
        <View style={styles.navigationPanel}>
          <View style={styles.destinationInfo}>
            <MaterialIcons 
              name={target.type === 'pickup' ? 'person-pin' : 'place'} 
              size={24} 
              color={colors.primary[500]} 
            />
            <View style={styles.destinationText}>
              <Text style={styles.destinationTitle}>{target.title}</Text>
              <Text style={styles.destinationDescription}>{target.description}</Text>
            </View>
          </View>

          {navigationButtonText && (
            <TouchableOpacity 
              style={styles.navigationButton} 
              onPress={handleNavigationAction}
            >
              <Text style={styles.navigationButtonText}>{navigationButtonText}</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* No Active Ride State */}
      {!activeRide && (
        <View style={styles.noRidePanel}>
          <MaterialIcons 
            name="local-taxi" 
            size={48} 
            color={isOnline ? colors.primary[400] : colors.gray[400]} 
          />
          <Text style={styles.noRideText}>
            {isOnline ? "You're Online" : "You're Offline"}
          </Text>
          <Text style={styles.noRideSubtext}>
            {isOnline ? "Waiting for ride requests..." : "Go online to receive ride requests"}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  map: {
    flex: 1,
  },
  controlsContainer: {
    position: 'absolute',
    right: 16,
    top: 100,
    alignItems: 'flex-end',
  },
  myLocationButton: {
    backgroundColor: '#fff',
    borderRadius: 50,
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  speedDisplay: {
    backgroundColor: colors.gray[900],
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  speedText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  driverMarker: {
    backgroundColor: colors.primary[500],
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  pickupMarker: {
    backgroundColor: colors.success[500],
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  destinationMarker: {
    backgroundColor: colors.error[500],
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  navigationPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  destinationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  destinationText: {
    marginLeft: 12,
    flex: 1,
  },
  destinationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 2,
  },
  destinationDescription: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  navigationButton: {
    backgroundColor: colors.primary[500],
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  navigationButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  noRidePanel: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  noRideText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginTop: 12,
    marginBottom: 4,
  },
  noRideSubtext: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  statusToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  onlineToggle: {
    backgroundColor: colors.success[50],
    borderWidth: 1,
    borderColor: colors.success[200],
  },
  offlineToggle: {
    backgroundColor: colors.gray[50],
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  statusText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '500',
  },
  onlineText: {
    color: colors.success[700],
  },
  offlineText: {
    color: colors.gray[600],
  },
});

export default DriverMapScreen;
