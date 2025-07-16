import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, PermissionsAndroid, Platform, TouchableOpacity } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import Geolocation from '@react-native-community/geolocation';
import { useIsFocused } from '@react-navigation/native';
// @ts-ignore
import PolylineDecoder from '@mapbox/polyline';
import { useRideStore } from '../store/useRideStore';
import { colors } from '../theme';

type Props = {
  encodedPolyline?: string;
  driverLocation?: {latitude: number, longitude: number} | null;
};

const DEFAULT_REGION = {
  latitude: 54.607868,
  longitude: -5.926437,
  latitudeDelta: 0.015,
  longitudeDelta: 0.015,
};

const MapScreen: React.FC<Props> = ({ encodedPolyline, driverLocation }) => {
  const mapRef = useRef<MapView>(null);
  const isFocused = useIsFocused();

  const {
    location,
    setLocation,
    routeCoordinates,
    setRouteCoordinates,
  } = useRideStore();

  useEffect(() => {
    if (!isFocused) return;
    if (location) return;

    const getLocation = async () => {
      try {
        if (Platform.OS === 'android') {
          try {
            const granted = await PermissionsAndroid.request(
              PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
            );
            if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
              console.log('Location permission denied');
              return;
            }
          } catch (permissionError) {
            console.warn('Permission request failed:', permissionError);
            return;
          }
        }
        
        Geolocation.getCurrentPosition(
          (pos) => {
            try {
              setLocation({
                latitude: pos.coords.latitude,
                longitude: pos.coords.longitude,
              });
            } catch (setError) {
              console.warn('Failed to set location:', setError);
            }
          },
          (err) => {
            console.warn('Geolocation error:', err);
          },
          { enableHighAccuracy: false, timeout: 15000, maximumAge: 10000 }
        );
      } catch (error) {
        console.warn('Location setup failed:', error);
      }
    };
    
    // Add delay to prevent immediate crash
    const timeoutId = setTimeout(() => {
      getLocation();
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [isFocused, location, setLocation]);

  useEffect(() => {
    if (encodedPolyline) {
      try {
        const decoded = PolylineDecoder.decode(encodedPolyline).map(
          ([latitude, longitude]: [number, number]) => ({ latitude, longitude })
        );
        setRouteCoordinates(decoded);

        if (mapRef.current && decoded.length > 0) {
          setTimeout(() => {
            try {
              mapRef.current?.fitToCoordinates(decoded, {
                edgePadding: { top: 80, right: 80, bottom: 80, left: 80 },
                animated: true,
              });
            } catch (fitError) {
              console.warn('Failed to fit coordinates:', fitError);
            }
          }, 500);
        }
      } catch (decodeError) {
        console.warn('Failed to decode polyline:', decodeError);
        setRouteCoordinates([]);
      }
    } else {
      setRouteCoordinates([]);
    }
  }, [encodedPolyline, setRouteCoordinates]);

  useEffect(() => {
    if (mapRef.current && routeCoordinates.length > 0 && isFocused) {
      mapRef.current.fitToCoordinates(routeCoordinates, {
        edgePadding: { top: 80, right: 80, bottom: 80, left: 80 },
        animated: true,
      });
    }
  }, [encodedPolyline, isFocused]);

  const handleMyLocation = () => {
    if (location && mapRef.current) {
      mapRef.current.animateToRegion({
        ...location,
        latitudeDelta: 0.015,
        longitudeDelta: 0.015,
      }, 500);
    }
  };

  const region = location
    ? { ...location, latitudeDelta: 0.015, longitudeDelta: 0.015 }
    : DEFAULT_REGION;

  return (
    <View style={styles.container}>
      {/* Map with error boundary */}
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={region}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={false}
        mapType="standard"
        loadingEnabled={true}
        loadingIndicatorColor="#007bff"
        onMapReady={() => {
          console.log('Map ready');
        }}
      >
        {location && (
          <Marker
            coordinate={location}
            title="You are here"
            description="Your current location"
            pinColor="#007bff"
          />
        )}

        {routeCoordinates.length > 0 && (
          <>
            <Polyline
              coordinates={routeCoordinates}
              strokeWidth={5}
              strokeColor="#007bff"
            />
            <Marker
              coordinate={routeCoordinates[0]}
              title="Pickup"
              description="Pickup location"
              pinColor="green"
            />
            <Marker
              coordinate={routeCoordinates[routeCoordinates.length - 1]}
              title="Dropoff"
              description="Dropoff location"
              pinColor="red"
            />
          </>
        )}

        {driverLocation && (
          <Marker
            coordinate={driverLocation}
            title="Your Driver"
            description="Driver's current location"
            pinColor="orange"
          />
        )}
      </MapView>

      <TouchableOpacity style={styles.myLocationBtn} onPress={handleMyLocation}>
        <Text style={{ color: '#007bff', fontWeight: 'bold', fontSize: 16 }}>◎</Text>
      </TouchableOpacity>
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
  myLocationBtn: {
    position: 'absolute',
    bottom: 24,
    right: 18,
    backgroundColor: 'white',
    borderRadius: 22,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    borderWidth: 1,
    borderColor: '#bbb',
  },
});

export default MapScreen;
