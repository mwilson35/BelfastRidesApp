import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, PermissionsAndroid, Platform } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import Geolocation from '@react-native-community/geolocation';
import PolylineDecoder from '@mapbox/polyline';

type Props = {
  encodedPolyline?: string;
};

const MapScreen: React.FC<Props> = ({ encodedPolyline }) => {
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  useEffect(() => {
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
        (pos: any) => {
          setLocation({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          });
        },
        (err: any) => console.warn(err),
        { enableHighAccuracy: true, timeout: 20000, maximumAge: 1000 }
      );
    };
    getLocation();
  }, []);

  // Decode the polyline into coordinates
  let routeCoordinates: { latitude: number; longitude: number }[] = [];
  if (encodedPolyline) {
    try {
      routeCoordinates = PolylineDecoder.decode(encodedPolyline).map(
        ([latitude, longitude]: [number, number]) => ({ latitude, longitude })
      );
    } catch (e) {}
  }

  if (!location) {
    return (
      <View style={styles.center}>
        <Text>Getting location...</Text>
      </View>
    );
  }

  // Center map: on route, or on user
  const initialRegion = routeCoordinates.length
    ? {
        latitude: routeCoordinates[0].latitude,
        longitude: routeCoordinates[0].longitude,
        latitudeDelta: 0.04,
        longitudeDelta: 0.04,
      }
    : {
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.015,
        longitudeDelta: 0.015,
      };

  return (
    <MapView
      style={{ flex: 1 }}
      showsUserLocation
      initialRegion={initialRegion}
    >
      <Marker
        coordinate={location}
        title="You are here"
        description="Your current location"
      />
      {routeCoordinates.length > 0 && (
        <Polyline
          coordinates={routeCoordinates}
          strokeWidth={5}
        />
      )}
    </MapView>
  );
};

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});

export default MapScreen;
