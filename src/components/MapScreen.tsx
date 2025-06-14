import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, PermissionsAndroid, Platform, TouchableOpacity } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import Geolocation from '@react-native-community/geolocation';
// @ts-ignore
import PolylineDecoder from '@mapbox/polyline';

type Props = {
  encodedPolyline?: string;
};

const MapScreen: React.FC<Props> = ({ encodedPolyline }) => {
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [mapRegion, setMapRegion] = useState<any>(null);
  const mapRef = useRef<MapView | null>(null);

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
          const coords = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          };
          setLocation(coords);
          setMapRegion({
            ...coords,
            latitudeDelta: 0.015,
            longitudeDelta: 0.015,
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

  // Snap map to route whenever a new route is set
  useEffect(() => {
    if (mapRef.current && routeCoordinates.length > 0) {
      mapRef.current.fitToCoordinates(routeCoordinates, {
        edgePadding: { top: 80, right: 80, bottom: 80, left: 80 },
        animated: true,
      });
    }
  }, [encodedPolyline]);

  // Recenters map on your location
  const handleMyLocation = () => {
    if (location && mapRef.current) {
      mapRef.current.animateToRegion({
        ...location,
        latitudeDelta: 0.015,
        longitudeDelta: 0.015,
      }, 500);
    }
  };

  if (!location) {
    return (
      <View style={styles.center}>
        <Text>Getting location...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <MapView
        ref={mapRef}
        style={{ flex: 1 }}
        showsUserLocation
        initialRegion={mapRegion}
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
            strokeColor="#007bff"
          />
        )}
      </MapView>
      {/* "My Location" floating button */}
      <TouchableOpacity style={styles.myLocationBtn} onPress={handleMyLocation}>
        <Text style={{ color: '#007bff', fontWeight: 'bold', fontSize: 16 }}>◎</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
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
    borderColor: '#bbb'
  },
});

export default MapScreen;
