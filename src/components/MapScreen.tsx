import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, PermissionsAndroid, Platform, TouchableOpacity } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import Geolocation from '@react-native-community/geolocation';
import { useIsFocused } from '@react-navigation/native';
// @ts-ignore
import PolylineDecoder from '@mapbox/polyline';
import { useRideStore } from '../store/useRideStore';

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
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          return;
        }
      }
      Geolocation.getCurrentPosition(
        (pos) => {
          setLocation({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          });
        },
        (err) => {
          console.warn(err);
        },
        { enableHighAccuracy: true, timeout: 20000, maximumAge: 1000 }
      );
    };
    getLocation();
  }, [isFocused, location]);

  useEffect(() => {
    if (encodedPolyline) {
      try {
        const decoded = PolylineDecoder.decode(encodedPolyline).map(
          ([latitude, longitude]: [number, number]) => ({ latitude, longitude })
        );
        setRouteCoordinates(decoded);

        if (mapRef.current && decoded.length > 0) {
          mapRef.current.fitToCoordinates(decoded, {
            edgePadding: { top: 80, right: 80, bottom: 80, left: 80 },
            animated: true,
          });
        }
      } catch (e) {
        setRouteCoordinates([]);
      }
    } else {
      setRouteCoordinates([]);
    }
  }, [encodedPolyline]);

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
    <View style={{ flex: 1 }}>
      <MapView
        ref={mapRef}
        style={{ flex: 1 }}
        initialRegion={region}
        showsUserLocation
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
